<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\FlightStatusNotification;
use App\Models\Event;
use App\Models\Guest;
use App\Models\LiveUpdate;
use App\Models\PolaroidImage;
use App\Models\SongRequest;
use App\Models\Table;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class TestController extends Controller
{
    use ApiResponse;

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
                'message' => "Driver: {$driver}".($driver === 'log' ? ' (events logged, not broadcast)' : ''),
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

        $allOk = ! collect($checks)->contains('status', 'error');

        return $this->successResponse([
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
        return $this->successResponse([
            'guests' => Guest::count(),
            'tables' => Table::count(),
            'polaroid_images' => PolaroidImage::count(),
            'schedule_events' => Event::count(),
            'live_updates' => LiveUpdate::count(),
            'song_requests' => SongRequest::count(),
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

        return $this->successResponse($update, 'Live update posted');
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

        return $this->successResponse($image, 'Polaroid simulated');
    }

    /**
     * Simulate a guest song request from the Test Lab.
     *
     * Goes straight to the database: it skips the guest rate limit and does
     * not raise an admin notification, so test data never pings anyone.
     */
    public function simulateSongRequest(Request $request)
    {
        $request->validate([
            'song_title' => 'required|string|max:255',
            'artist' => 'nullable|string|max:255',
            'guest_name' => 'nullable|string|max:100',
        ]);

        $artist = $request->artist ?: 'Test Lab';
        $guestName = $request->guest_name ?: 'Test Lab';

        $song = SongRequest::create([
            'guest_name' => $guestName,
            'song_data' => ['name' => $request->song_title, 'artist' => $artist],
            'song_title' => $request->song_title,
            'artist' => $artist,
            'is_played' => false,
        ]);

        return $this->createdResponse($song, 'Song request simulated — open the Song Requests page to see it');
    }

    /**
     * Walk the song request feature end to end (create → list → stats →
     * played → unplayed → delete) and report how each step went.
     *
     * Everything it creates it deletes again, so running this on production
     * leaves no test rows behind.
     */
    public function songRequestChecks()
    {
        $baseline = SongRequest::count();
        $steps = [];
        $song = null;

        $run = function (string $name, callable $step) use (&$steps) {
            try {
                $steps[] = ['name' => $name, 'status' => 'ok', 'message' => (string) ($step() ?? 'Passed')];
            } catch (\Throwable $e) {
                $steps[] = ['name' => $name, 'status' => 'error', 'message' => $e->getMessage()];
            }
        };

        $run('Create a test request', function () use (&$song) {
            $song = SongRequest::create([
                'guest_name' => 'Test Lab',
                'song_data' => ['name' => 'Test Lab Song', 'artist' => 'Test Lab Artist'],
                'song_title' => 'Test Lab Song',
                'artist' => 'Test Lab Artist',
                'is_played' => false,
            ]);
            $this->checkSongRequest($song->exists && $song->id !== null, 'The record was not saved');

            return "Saved request #{$song->id}";
        });

        $run('Appears in the guest list', function () use ($song) {
            $this->checkSongRequest($song !== null && SongRequest::whereKey($song->id)->exists(), 'Not found after saving');

            return 'Present in '.SongRequest::count().' request(s)';
        });

        $run('Counted as pending in the stats', function () use ($song) {
            $this->checkSongRequest(
                $song !== null && SongRequest::whereKey($song->id)->where('is_played', false)->exists(),
                'Stats do not count it as pending'
            );

            return 'Pending stats include it';
        });

        $run('Mark as played', function () use ($song) {
            $song->update(['is_played' => true, 'played_at' => now()]);
            $song->refresh();
            $this->checkSongRequest($song->is_played === true, 'is_played was not set');
            $this->checkSongRequest($song->played_at !== null, 'played_at was not set');

            return 'is_played=true with played_at';
        });

        $run('Mark as not played again', function () use ($song) {
            $song->update(['is_played' => false, 'played_at' => null]);
            $song->refresh();
            $this->checkSongRequest($song->is_played === false, 'is_played was not cleared');
            $this->checkSongRequest($song->played_at === null, 'played_at was not cleared');

            return 'Back to pending';
        });

        $run('Delete and leave no trace', function () use ($song, $baseline) {
            $song->delete();
            $this->checkSongRequest(! SongRequest::whereKey($song->id)->exists(), 'The record still exists');
            $this->checkSongRequest(SongRequest::count() === $baseline, "Row count changed (expected {$baseline})");

            return 'Cleaned up';
        });

        $passed = collect($steps)->where('status', 'ok')->count();
        $failed = count($steps) - $passed;

        return $this->successResponse([
            'passed' => $passed,
            'failed' => $failed,
            'steps' => $steps,
        ], $failed ? "{$failed} song request check(s) failed" : "All {$passed} song request checks passed");
    }

    /** Assert inside a check step; failures are reported, not thrown at the client. */
    private function checkSongRequest(bool $condition, string $message): void
    {
        if (! $condition) {
            throw new \RuntimeException($message);
        }
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
                    ->subject('Test Email: '.ucfirst(str_replace('_', ' ', $type)))
                    ->html("<h1>This is a test email</h1><p>Type: $type</p><p>If you see this, email sending is configured correctly!</p>");
            });

            return $this->successResponse(null, 'Test email sent successfully!');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to send email', 500, $e->getMessage());
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

        $previousStatus = match ($type) {
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

            return $this->successResponse(null, "Test flight notification ({$type}) sent to {$request->email}");
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to send flight notification', 500, $e->getMessage());
        }
    }
}
