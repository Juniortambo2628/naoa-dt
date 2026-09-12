<?php

namespace App\Console\Commands;

use App\Mail\FlightStatusNotification;
use App\Models\GuestTravelDetail;
use App\Services\FlightService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class CheckFlightStatuses extends Command
{
    protected $signature = 'flights:check-status';
    protected $description = 'Check flight statuses and send notifications for changes';

    public function handle(FlightService $flightService): int
    {
        $travelDetails = GuestTravelDetail::whereNotNull('flight_number')
            ->where('flight_number', '!=', '')
            ->where(function ($query) {
                $query->whereNull('last_flight_check_at')
                    ->orWhere('last_flight_check_at', '<', now()->subMinutes(30));
            })
            ->whereHas('guest', function ($query) {
                $query->where('rsvp_status', 'confirmed');
            })
            ->with('guest')
            ->get();

        if ($travelDetails->isEmpty()) {
            $this->info('No flights to check.');
            return Command::SUCCESS;
        }

        $this->info("Checking {$travelDetails->count()} flights...");

        $notificationsSent = 0;

        foreach ($travelDetails as $detail) {
            try {
                $flightData = $flightService->lookupFlight(
                    $detail->flight_number,
                    $detail->flight_departure?->format('Y-m-d')
                );

                if (!$flightData) {
                    $this->warn("Could not fetch data for flight {$detail->flight_number}");
                    continue;
                }

                $previousSnapshot = $detail->flight_status_snapshot;
                $changeType = $this->detectChange($previousSnapshot, $flightData);

                // Update snapshot
                $detail->update([
                    'flight_status_snapshot' => $flightData,
                    'last_flight_check_at' => now(),
                ]);

                // Send notification if there's a significant change
                if ($changeType && $detail->guest) {
                    Mail::to('invites-dntwed@okjtech.co.ke')->send(
                        new FlightStatusNotification(
                            guestName: $detail->guest->name,
                            flightNumber: $detail->flight_number,
                            status: $flightData['status'] ?? 'unknown',
                            flightData: $flightData,
                            previousStatus: $previousSnapshot,
                            changeType: $changeType,
                        )
                    );

                    $notificationsSent++;
                    $this->info("Notification sent for {$detail->guest->name}'s flight {$detail->flight_number} ({$changeType})");
                }

                // Small delay to respect API rate limits
                usleep(500000); // 0.5 seconds

            } catch (\Exception $e) {
                Log::error("Flight check failed for {$detail->flight_number}: " . $e->getMessage());
                $this->error("Error checking flight {$detail->flight_number}: {$e->getMessage()}");
            }
        }

        $this->info("Done. Checked {$travelDetails->count()} flights, sent {$notificationsSent} notifications.");
        return Command::SUCCESS;
    }

    private function detectChange(?array $previous, array $current): ?string
    {
        if (!$previous) {
            // First time checking - only notify if already delayed or cancelled
            $status = $current['status'] ?? '';
            if ($status === 'cancelled') return 'cancelled';
            if (($current['delay_arrival'] ?? 0) > 15) return 'delayed';
            return null;
        }

        $prevStatus = $previous['status'] ?? '';
        $currStatus = $current['status'] ?? '';

        // Status changed to cancelled
        if ($prevStatus !== 'cancelled' && $currStatus === 'cancelled') {
            return 'cancelled';
        }

        // Status changed to diverted
        if ($prevStatus !== 'diverted' && $currStatus === 'diverted') {
            return 'diverted';
        }

        // Delay increased significantly (> 15 min change)
        $prevDelay = $previous['delay_arrival'] ?? 0;
        $currDelay = $current['delay_arrival'] ?? 0;
        if ($currDelay > $prevDelay + 15) {
            return 'delayed';
        }

        // Gate changed
        $prevGate = $previous['arrival_gate'] ?? null;
        $currGate = $current['arrival_gate'] ?? null;
        if ($prevGate && $currGate && $prevGate !== $currGate) {
            return 'gate_change';
        }

        // Status changed (e.g., from scheduled to active)
        if ($prevStatus !== $currStatus && in_array($currStatus, ['active', 'landed'])) {
            return 'status_change';
        }

        return null;
    }
}
