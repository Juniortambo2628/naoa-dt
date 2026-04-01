<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GuestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'group' => $this->group,
            'plus_ones_allowed' => $this->plus_ones_allowed,
            'unique_code' => $this->unique_code,
            'table_id' => $this->table_id,
            'song_request' => $this->song_request,
            'qr_code' => $this->qr_code,
            'checked_in_at' => $this->checked_in_at,
            'dietary_preference' => $this->dietary_preference,
            'rsvp_status' => $this->rsvp_status,
            'invitation_via' => $this->invitation_via,
            'confirmed_plus_ones' => $this->confirmed_plus_ones,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // Relationships
            'rsvpResponse' => $this->whenLoaded('rsvpResponse'),
            'invitation' => $this->whenLoaded('invitation'),
            'plusOnes' => $this->whenLoaded('plusOnes'),
            'parentGuest' => $this->whenLoaded('parentGuest'),
        ];
    }
}
