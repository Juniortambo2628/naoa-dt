<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SongRequestResource;
use App\Models\SongRequest;
use App\Traits\AdminNotifiable;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SongRequestController extends Controller
{
    use AdminNotifiable, ApiResponse;

    public function index()
    {
        $songs = SongRequest::orderBy('created_at', 'asc')->get();

        $stats = [
            'total'   => SongRequest::count(),
            'played'  => SongRequest::where('is_played', true)->count(),
            'pending' => SongRequest::where('is_played', false)->count(),
        ];

        return response()->json([
            'songs' => SongRequestResource::collection($songs),
            'stats' => $stats,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'guest_name'    => 'required|string|max:100',
            'song_data'     => 'required|array',
            'song_data.name' => 'required|string',
            'song_data.artist' => 'required|string',
        ]);

        $isLimitEnabled = \App\Models\Setting::getValue('song_request_limit_enabled', 'true') === 'true';
        
        if ($isLimitEnabled) {
            $oneHourAgo = now()->subHour();
            $count = SongRequest::where('created_at', '>=', $oneHourAgo)->count();
            
            if ($count >= 5) {
                $oldestInHour = SongRequest::where('created_at', '>=', $oneHourAgo)
                    ->orderBy('created_at', 'asc')
                    ->first();
                
                $nextAvailableAt = $oldestInHour->created_at->addHour();
                $secondsLeft = now()->diffInSeconds($nextAvailableAt, false);
                
                return $this->errorResponse(
                    'Song request limit reached (5 per hour). Please try again soon!',
                    429,
                    [
                        'seconds_left'     => max(0, (int) $secondsLeft),
                        'next_available_at' => $nextAvailableAt->toIso8601String(),
                    ]
                );
            }
        }

        $songRequest = SongRequest::create([
            'guest_name' => $request->guest_name,
            'song_data'  => $request->song_data,
            'song_title' => $request->song_data['name'],
            'artist'     => $request->song_data['artist'],
        ]);

        $this->notifyAdmin(
            'SongRequested',
            'New Song Request',
            "{$songRequest->guest_name} requested '{$songRequest->song_title}'",
            'music'
        );

        return $this->createdResponse(
            new SongRequestResource($songRequest),
            'Song request submitted!'
        );
    }

    public function markPlayed(SongRequest $songRequest): JsonResponse
    {
        $songRequest->update([
            'is_played' => true,
            'played_at' => now(),
        ]);

        return $this->successResponse(null, 'Song marked as played');
    }

    public function destroy(SongRequest $songRequest): JsonResponse
    {
        $songRequest->delete();

        return $this->deletedResponse('Song request removed');
    }
}
