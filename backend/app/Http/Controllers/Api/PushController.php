<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendPushBroadcast;
use App\Models\Guest;
use App\Models\PushBroadcast;
use App\Models\PushSubscription;
use App\Services\WebPushService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Guest web push notifications: guests' devices subscribe from the digital
 * invitation; admins send announcements from Admin → Announcements.
 */
class PushController extends Controller
{
    use ApiResponse;

    public function __construct(private WebPushService $push) {}

    /** The VAPID public key browsers need to subscribe. */
    public function publicKey(): JsonResponse
    {
        $key = $this->push->publicKey();

        return $key
            ? $this->successResponse(['public_key' => $key])
            : $this->errorResponse('Push notifications are not available right now.', 503);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => 'required|url|starts_with:https://|max:2000',
            'keys.p256dh' => 'required|string|max:255',
            'keys.auth' => 'required|string|max:255',
            'content_encoding' => 'nullable|string|in:aesgcm,aes128gcm',
            'code' => 'nullable|string|max:64',
        ]);

        $guestId = ! empty($validated['code'])
            ? Guest::where('unique_code', $validated['code'])->value('id')
            : null;

        $hash = PushSubscription::hashEndpoint($validated['endpoint']);
        $existing = PushSubscription::where('endpoint_hash', $hash)->first();

        $subscription = PushSubscription::updateOrCreate(
            ['endpoint_hash' => $hash],
            [
                'endpoint' => $validated['endpoint'],
                'public_key' => $validated['keys']['p256dh'],
                'auth_token' => $validated['keys']['auth'],
                'content_encoding' => $validated['content_encoding'] ?? 'aes128gcm',
                // Keep the known guest if this visit didn't say who it was.
                'guest_id' => $guestId ?? $existing?->guest_id,
                'user_agent' => Str::limit((string) $request->userAgent(), 250, ''),
            ]
        );

        return $this->createdResponse(['id' => $subscription->id], 'Notifications turned on');
    }

    public function unsubscribe(Request $request): JsonResponse
    {
        $validated = $request->validate(['endpoint' => 'required|string|max:2000']);

        PushSubscription::where('endpoint_hash', PushSubscription::hashEndpoint($validated['endpoint']))->delete();

        return $this->deletedResponse('Notifications turned off');
    }

    /** Admin: subscriber numbers and the announcement history. */
    public function index(): JsonResponse
    {
        return $this->successResponse([
            'available' => (bool) $this->push->publicKey(),
            'stats' => [
                'devices' => PushSubscription::count(),
                'guests' => PushSubscription::whereNotNull('guest_id')->distinct()->count('guest_id'),
                'confirmed_devices' => PushSubscription::whereHas('guest', fn ($q) => $q->where('rsvp_status', 'confirmed'))->count(),
            ],
            'broadcasts' => PushBroadcast::with('user:id,name')->latest()->limit(50)->get(),
        ]);
    }

    /** Admin: queue an announcement to every subscribed device in the audience. */
    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:100',
            'body' => 'required|string|max:500',
            // The guest's invitation ("invite", or a section: "invite#programme"),
            // a page on this site ("/gallery") or a full https link.
            'url' => ['nullable', 'string', 'max:255', 'regex:#^(invite(\#[a-z-]+)?$|/(?!/)|https://)#'],
            'audience' => ['nullable', Rule::in(PushBroadcast::AUDIENCES)],
        ]);

        $broadcast = PushBroadcast::create([
            ...$validated,
            'audience' => $validated['audience'] ?? 'all',
            'user_id' => $request->user()?->id,
            'status' => 'queued',
        ]);

        $recipients = $broadcast->recipients()->count();
        SendPushBroadcast::dispatch($broadcast->id);

        return $this->createdResponse(
            ['broadcast' => $broadcast->fresh(), 'recipients' => $recipients],
            $recipients ? "Sending to {$recipients} device(s)" : 'No devices have notifications turned on yet'
        );
    }
}
