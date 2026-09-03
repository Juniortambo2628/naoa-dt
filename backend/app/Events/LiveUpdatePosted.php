<?php

namespace App\Events;

use App\Models\LiveUpdate;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LiveUpdatePosted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $update;

    public function __construct(LiveUpdate $update)
    {
        $this->update = $update;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('live-updates'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'update.posted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->update->id,
            'message' => $this->update->message,
            'type' => $this->update->type,
            'schedule_item_id' => $this->update->schedule_item_id,
            'schedule_item' => $this->update->scheduleItem?->only(['id', 'title', 'start_time', 'end_time']),
            'created_at' => $this->update->created_at->toISOString(),
        ];
    }
}
