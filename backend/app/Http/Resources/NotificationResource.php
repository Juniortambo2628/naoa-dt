<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'type'       => $this->type,
            'title'      => $this->data['title'] ?? null,
            'message'    => $this->data['message'] ?? null,
            'icon'       => $this->data['icon'] ?? 'bell',
            'read_at'    => $this->read_at,
            'created_at' => $this->created_at,
        ];
    }
}
