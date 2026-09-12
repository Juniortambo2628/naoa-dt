<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Models\Guest;
use App\Models\Table;
use App\Models\PolaroidImage;
use App\Models\Event;
use App\Models\LiveUpdate;
use App\Mail\FlightStatusNotification;

class TestController extends Controller
{
    /**
     * API health check — returns status of all critical services.
     */
    public function healthCheck()
    {
        $checks = [];

        try {
            DB::connection()->getPdo();
            $checks['database'] = ['status' => 'ok', 'message' => 'Connected'];
        } catch (\Exception $e) {
            $checks['database'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        try {
            Cache::put('health_check', true, 10);
            $checks['cache'] = ['status' => 'ok', 'message' => 'Working'];
        } catch (\Exception $e) {
            $checks['cache'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        try {
            $driver = config('broadcasting.default');
            $checks['broadcasting'] = [
                'status' => $driver === 'log' ? 'warning' : 'ok',
                'message' => "Driver: {$driver}" . ($driver === 'log' ? ' (events logged, not broadcast)' : ''),
            ];
        } catch (\Exception $e) {
            $checks['broadcasting'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        try {
            $host = config('mail.mailers.smtp.host');
            $port = config('mail.mailers.smtp.port');
            $checks['mail'] = [
                'status' => $host ? 'ok' : 'warning',
                'message' => $host ? "{$host}:{$port}" : 'Not configured',
            ];
        } catch (\Exception $e) {
            $checks['mail'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        try {
            $disk = config('filesystems.default');
            $checks['storage'] = ['status' => 'ok', 'message' => "Driver: {$disk}"];
        } catch (\Exception $e) {
            $checks['storage'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        $allOk = !collect($checks)->contains('status', 'error');

        return response()->json([
            'status' => $allOk ? 'healthy' : 'degraded',
            'checks' => $checks,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Quick endpoint stats — counts for key entities.
     */
    public function stats()
    {
        return response()->json([
            'guests' => Guest::count(),
            'tables' => Table::count(),
            'polaroid_images' => PolaroidImage::count(),
            'schedule_events' => Event::count(),
            'live_updates' => LiveUpdate::count(),
        ]);
    }

    /**
     * Simulate a live update broadcast.
     */
    public function simulateLiveUpdate(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:500',
            'type' => 'nullable|in:normal,important,alert',
        ]);

        $update = LiveUpdate::create([
            'message' => $request->message,
            'type' => $request->type ?? 'normal',
        ]);

        if (class_exists(\App\Events\LiveUpdatePosted::class)) {
            event(new \App\Events\LiveUpdatePosted($update));
        }

        return response()->json(['message' => 'Live update posted', 'update' => $update]);
    }

    /**
     * Simulate a polaroid image upload.
     */
    public function simulatePolaroid(Request $request)
    {
        $request->validate([
            'note' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        $image = PolaroidImage::create([
            'image_path' => '/storage/polaroids/placeholder.svg',
            'note' => $request->note ?? 'Test polaroid from admin',
            'location' => $request->location ?? 'Test Lab',
            'taken_at' => now(),
        ]);

        if (class_exists(\App\Events\PolaroidImageCreated::class)) {
            event(new \App\Events\PolaroidImageCreated($image));
        }

        return response()->json(['message' => 'Polaroid simulated', 'image' => $image]);
    }

    /**
     * Send a test email to a specific address.
     */
    public function sendTestEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'type' => 'required|in:invitation,rsvp_confirmation',
        ]);

        $email = $request->email;
        $type = $request->type;

        try {
            Mail::send([], [], function ($message) use ($email, $type) {
                $message->to($email)
                        ->subject('Test Email: ' . ucfirst(str_replace('_', ' ', $type)))
                        ->html("<h1>This is a test email</h1><p>Type: $type</p><p>If you see this, email sending is configured correctly!</p>");
            });

            return response()->json(['message' => 'Test email sent successfully!']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send email',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send a test flight notification email.
     */
    public function sendTestFlightNotification(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'type' => 'required|in:delayed,cancelled,gate_change,diverted,status_change',
        ]);

        $testFlights = [
            'delayed' => [
                'flight_number' => 'KQ 100',
                'status' => 'active',
                'airline' => 'Kenya Airways',
                'departure_iata' => 'NBO',
                'departure_airport' => 'Jomo Kenyatta International',
                'arrival_iata' => 'MBA',
                'arrival_airport' => 'Moi International Airport',
                'departure_scheduled' => '2026-09-15T08:00:00',
                'arrival_scheduled' => '2026-09-15T09:30:00',
                'arrival_estimated' => '2026-09-15T10:15:00',
                'delay_arrival' => 45,
                'arrival_gate' => 'B12',
                'arrival_terminal' => '1A',
            ],
            'cancelled' => [
                'flight_number' => 'BA 274',
                'status' => 'cancelled',
                'airline' => 'British Airways',
                'departure_iata' => 'LHR',
                'departure_airport' => 'Heathrow',
                'arrival_iata' => 'NBO',
                'arrival_airport' => 'Jomo Kenyatta International',
                'departure_scheduled' => '2026-09-14T20:00:00',
                'arrival_scheduled' => '2026-09-15T06:00:00',
                'arrival_estimated' => null,
                'delay_arrival' => 0,
                'arrival_gate' => null,
                'arrival_terminal' => '5',
            ],
            'gate_change' => [
                'flight_number' => 'ET 302',
                'status' => 'active',
                'airline' => 'Ethiopian Airlines',
                'departure_iata' => 'ADD',
                'departure_airport' => 'Bole International',
                'arrival_iata' => 'NBO',
                'arrival_airport' => 'Jomo Kenyatta International',
                'departure_scheduled' => '2026-09-15T06:00:00',
                'arrival_scheduled' => '2026-09-15T08:30:00',
                'arrival_estimated' => '2026-09-15T08:25:00',
                'delay_arrival' => 0,
                'arrival_gate' => 'C23',
                'arrival_terminal' => '1A',
            ],
            'diverted' => [
                'flight_number' => 'QK 401',
                'status' => 'diverted',
                'airline' => 'Kenya Airways',
                'departure_iata' => 'MBA',
                'departure_airport' => 'Moi International',
                'arrival_iata' => 'NBO',
                'arrival_airport' => 'Jomo Kenyatta International',
                'departure_scheduled' => '2026-09-15T10:00:00',
                'arrival_scheduled' => '2026-09-15T11:30:00',
                'arrival_estimated' => '2026-09-15T12:00:00',
                'delay_arrival' => 30,
                'arrival_gate' => null,
                'arrival_terminal' => '1A',
            ],
            'status_change' => [
                'flight_number' => 'PW 310',
                'status' => 'landed',
                'airline' => 'Precision Air',
                'departure_iata' => 'DAR',
                'departure_airport' => 'Julius Nyerere International',
                'arrival_iata' => 'NBO',
                'arrival_airport' => 'Jomo Kenyatta International',
                'departure_scheduled' => '2026-09-15T07:00:00',
                'arrival_scheduled' => '2026-09-15T09:00:00',
                'arrival_estimated' => '2026-09-15T08:55:00',
                'delay_arrival' => 0,
                'arrival_gate' => 'A08',
                'arrival_terminal' => '1A',
            ],
        ];

        $type = $request->type;
        $flightData = $testFlights[$type];
        $guestName = 'Test Guest';
        $flightNumber = $flightData['flight_number'];

        $previousStatus = match($type) {
            'delayed' => ['status' => 'active', 'delay_arrival' => 15],
            'cancelled' => ['status' => 'scheduled', 'delay_arrival' => 0],
            'gate_change' => ['status' => 'active', 'arrival_gate' => 'B15'],
            'diverted' => ['status' => 'active', 'arrival_gate' => 'A10'],
            default => null,
        };

        try {
            Mail::to($request->email)->send(
                new FlightStatusNotification(
                    guestName: $guestName,
                    flightNumber: $flightNumber,
                    status: $flightData['status'],
                    flightData: $flightData,
                    previousStatus: $previousStatus,
                    changeType: $type,
                )
            );

            return response()->json([
                'message' => "Test flight notification ({$type}) sent to {$request->email}",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send flight notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
