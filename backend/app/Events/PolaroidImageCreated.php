<?php

namespace App\Events;

use App\Models\PolaroidImage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PolaroidImageCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $polaroid;

    public function __construct(PolaroidImage $polaroid)
    {
        $this->polaroid = $polaroid;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('polaroid-feed'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'polaroid.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->polaroid->id,
            'image_path' => $this->polaroid->image_path,
            'full_image_url' => $this->polaroid->full_image_url,
            'title' => $this->polaroid->title,
            'caption' => $this->polaroid->caption,
            'taken_at' => $this->polaroid->taken_at?->toISOString(),
            'location' => $this->polaroid->location,
            'created_at' => $this->polaroid->created_at->toISOString(),
        ];
    }
}
