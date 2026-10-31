<?php

namespace App\Jobs;

use App\Models\PushBroadcast;
use App\Services\WebPushService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Delivers an announcement to every subscribed device in its audience. On
 * shared hosting the scheduler drains the queue once a minute, so sends go
 * out within about a minute of being queued.
 */
class SendPushBroadcast implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 120;

    public function __construct(public int $broadcastId) {}

    public function handle(WebPushService $push): void
    {
        $broadcast = PushBroadcast::find($this->broadcastId);
        if (! $broadcast || $broadcast->status !== 'queued') {
            return;
        }

        // Each guest's notification opens their own invitation.
        $payload = fn ($subscription) => [
            'title' => $broadcast->title,
            'body' => $broadcast->body,
            'url' => $broadcast->urlFor($subscription->guest),
            'tag' => 'broadcast-'.$broadcast->id,
        ];

        $sent = 0;
        $failed = 0;
        $broadcast->recipients()->with('guest:id,unique_code')->chunkById(100, function ($subscriptions) use ($push, $payload, &$sent, &$failed) {
            $result = $push->send($subscriptions, $payload);
            $sent += $result['sent'];
            $failed += $result['failed'];
        });

        $broadcast->update([
            'status' => $sent === 0 && $failed > 0 ? 'failed' : 'sent',
            'sent_count' => $sent,
            'failed_count' => $failed,
            'sent_at' => now(),
        ]);
    }

    public function failed(\Throwable $e): void
    {
        PushBroadcast::whereKey($this->broadcastId)->update(['status' => 'failed']);
    }
}
