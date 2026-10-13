<?php

namespace App\Http\Resources;

use App\Models\Guest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->data['title'] ?? null,
            'message' => $this->data['message'] ?? null,
            'icon' => $this->data['icon'] ?? 'bell',
            'link' => $this->link(),
            'read_at' => $this->read_at,
            'created_at' => $this->created_at,
        ];
    }

    /** Admin page the notification is about (frontend route). */
    private function link(): ?string
    {
        $data = $this->data ?? [];
        $type = class_basename((string) $this->type);

        return match (true) {
            str_contains($type, 'RSVP') => isset($data['guest_id'])
                ? '/admin/dashboard/guests?status=all&q='.rawurlencode((string) (Guest::withTrashed()->find($data['guest_id'])?->name ?? ''))
                : '/admin/dashboard/rsvps',
            str_contains($type, 'Gift') => '/admin/dashboard/gifts',
            str_contains($type, 'Song') => '/admin/dashboard/songs',
            str_contains($type, 'Enquiry') => '/admin/dashboard/enquiries',
            str_contains($type, 'Guestbook') => '/admin/dashboard/guestbook',
            str_contains($type, 'Schedule') => '/admin/dashboard/schedule',
            default => null,
        };
    }
}
