<?php

namespace App\Traits;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Str;

trait AdminNotifiable
{
    /**
     * Create a database notification for the admin user.
     *
     * @param string $type Notification type identifier (e.g., 'GiftClaimed', 'SongRequested')
     * @param string $title Short title for the notification
     * @param string $message Detailed message
     * @param string $icon Icon identifier (e.g., 'gift', 'music', 'rsvp')
     * @param array $extra Additional data to include
     */
    protected function notifyAdmin(
        string $type,
        string $title,
        string $message,
        string $icon = 'bell',
        array $extra = []
    ): void {
        try {
            $adminId = User::first()?->id ?? 1;

            Notification::create([
                'id' => Str::uuid(),
                'type' => $type,
                'notifiable_type' => User::class,
                'notifiable_id' => $adminId,
                'data' => array_merge([
                    'title' => $title,
                    'message' => $message,
                    'icon' => $icon,
                ], $extra),
            ]);
        } catch (\Exception $e) {
            \Log::warning('Failed to create admin notification: ' . $e->getMessage());
        }
    }
}
