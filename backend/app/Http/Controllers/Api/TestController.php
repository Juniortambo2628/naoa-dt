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
            'image_path' => '/uploads/polaroids/placeholder-' . time() . '.jpg',
            'note' => $request->note ?? 'Test polaroid from admin',
            'location' => $request->location ?? 'Test Lab',
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
}
