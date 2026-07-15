<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GuestbookEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'guest_name' => $this->guest_name,
            'message'    => $this->message,
            'created_at' => $this->created_at->format('M d, Y'),
            'time_ago'   => $this->created_at->diffForHumans(),
        ];
    }
}
