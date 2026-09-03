<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Models\Guest;
use App\Models\Invitation;
use App\Models\Table;
use App\Models\PolaroidImage;
use App\Models\ScheduleEvent;
use App\Models\LiveUpdate;

class TestController extends Controller
{
    /**
     * API health check — returns status of all critical services.
     */
    public function healthCheck()
    {
        $checks = [];

        // Database
        try {
            DB::connection()->getPdo();
            $checks['database'] = ['status' => 'ok', 'message' => 'Connected'];
        } catch (\Exception $e) {
            $checks['database'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        // Cache
        try {
            Cache::put('health_check', true, 10);
            $checks['cache'] = ['status' => 'ok', 'message' => 'Working'];
        } catch (\Exception $e) {
            $checks['cache'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        // Pusher/Broadcasting
        try {
            $driver = config('broadcasting.default');
            $checks['broadcasting'] = [
                'status' => $driver === 'log' ? 'warning' : 'ok',
                'message' => "Driver: {$driver}" . ($driver === 'log' ? ' (events logged, not broadcast)' : ''),
            ];
        } catch (\Exception $e) {
            $checks['broadcasting'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        // Mail
        try {
            config(['mail.default' => config('mail.mailer')]);
            $checks['mail'] = [
                'status' => 'ok',
                'message' => config('mail.mailers.smtp.host') . ':' . config('mail.mailers.smtp.port'),
            ];
        } catch (\Exception $e) {
            $checks['mail'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        // Storage
        try {
            $checks['storage'] = [
                'status' => 'ok',
                'message' => config('filesystems.default') . ' — ' . config('filesystems.disks.public.root'),
            ];
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
            'schedule_events' => ScheduleEvent::count(),
            'live_updates' => LiveUpdate::count(),
        ]);
    }

    /**
     * Simulate a live update broadcast (for testing without full event flow).
     */
    public function simulateLiveUpdate(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:500',
            'type' => 'nullable|in:info,warning,success',
        ]);

        $update = LiveUpdate::create([
            'message' => $request->message,
            'type' => $request->type ?? 'info',
        ]);

        // Broadcast if possible
        if (class_exists(\App\Events\LiveUpdatePosted::class)) {
            event(new \App\Events\LiveUpdatePosted($update));
        }

        return response()->json(['message' => 'Live update posted', 'update' => $update]);
    }

    /**
     * Simulate a polaroid image upload (creates a placeholder entry for testing).
     */
    public function simulatePolaroid(Request $request)
    {
        $request->validate([
            'caption' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        $image = PolaroidImage::create([
            'image_path' => '/uploads/polaroids/placeholder-' . time() . '.jpg',
            'caption' => $request->caption ?? 'Test polaroid from admin',
            'location' => $request->location ?? 'Test Lab',
            'is_live' => true,
        ]);

        // Broadcast if possible
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
            $mockGuest = new Guest([
                'name' => 'Test Guest',
                'email' => $email,
                'unique_code' => 'TEST-CODE-123',
                'group' => 'Family',
                'plus_ones_allowed' => 1
            ]);
            
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
