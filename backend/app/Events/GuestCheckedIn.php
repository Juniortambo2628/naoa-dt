<?php

namespace App\Events;

use App\Models\Guest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GuestCheckedIn implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $guest;

    public function __construct(Guest $guest)
    {
        $this->guest = $guest;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('guest-tracker'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'guest.checked-in';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->guest->id,
            'name' => $this->guest->name,
            'group' => $this->guest->group,
            'table_id' => $this->guest->table_id,
            'table_name' => $this->guest->table?->name,
            'checked_in_at' => $this->guest->checked_in_at?->toISOString(),
        ];
    }
}
