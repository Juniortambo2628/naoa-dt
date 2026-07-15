<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SongRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'guest_name'   => $this->guest_name,
            'song_title'   => $this->song_title,
            'artist'       => $this->artist,
            'song_data'    => $this->song_data,
            'is_played'    => $this->is_played,
            'requested_at' => $this->created_at->diffForHumans(),
        ];
    }
}
