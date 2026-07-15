<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $notifications = Notification::latest()->limit(10)->get();

        return $this->successResponse(NotificationResource::collection($notifications));
    }

    public function markAllRead(): JsonResponse
    {
        Notification::whereNull('read_at')->update(['read_at' => now()]);

        return $this->successResponse(null, 'All notifications marked as read');
    }
}
