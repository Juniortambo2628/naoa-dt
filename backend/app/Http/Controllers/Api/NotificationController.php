<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get recent notifications
     */
    public function index()
    {
        $notifications = Notification::latest()
            ->limit(10)
            ->get()
            ->map(function ($n) {
                return [
                    'id' => $n->id,
                    'type' => $n->type,
                    'data' => $n->data,
                    'read_at' => $n->read_at,
                    'created_at' => $n->created_at->diffForHumans(),
                ];
            });

        return response()->json($notifications);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllRead()
    {
        Notification::whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['success' => true]);
    }
}
