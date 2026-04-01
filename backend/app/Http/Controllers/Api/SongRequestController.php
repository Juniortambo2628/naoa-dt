<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SongRequest;
use Illuminate\Http\Request;

class SongRequestController extends Controller
{
    /**
     * Get all song requests (queue)
     */
    public function index()
    {
        $songs = SongRequest::orderBy('created_at', 'asc')
            ->get()
            ->map(function ($song) {
                return [
                    'id' => $song->id,
                    'guest_name' => $song->guest_name,
                    'song_title' => $song->song_title,
                    'artist' => $song->artist,
                    'song_data' => $song->song_data,
                    'is_played' => $song->is_played,
                    'requested_at' => $song->created_at->diffForHumans(),
                ];
            });

        $stats = [
            'total' => SongRequest::count(),
            'played' => SongRequest::where('is_played', true)->count(),
            'pending' => SongRequest::where('is_played', false)->count(),
        ];

        return response()->json([
            'songs' => $songs,
            'stats' => $stats,
        ]);
    }

    /**
     * Submit a new song request
     */
    public function store(Request $request)
    {
        $request->validate([
            'guest_name' => 'required|string|max:100',
            'song_data' => 'required|array',
            'song_data.name' => 'required|string',
            'song_data.artist' => 'required|string',
        ]);

        // Check if limit is enabled (Default enabled for public dashboard)
        $isLimitEnabled = \App\Models\Setting::getValue('song_request_limit_enabled', 'true') === 'true';
        
        if ($isLimitEnabled) {
            $oneHourAgo = now()->subHour();
            // Count total requests in the last hour
            $count = SongRequest::where('created_at', '>=', $oneHourAgo)->count();
            
            if ($count >= 5) {
                $oldestInHour = SongRequest::where('created_at', '>=', $oneHourAgo)
                    ->orderBy('created_at', 'asc')
                    ->first();
                
                $nextAvailableAt = $oldestInHour->created_at->addHour();
                $secondsLeft = now()->diffInSeconds($nextAvailableAt, false);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Song request limit reached (5 per hour). Please try again soon!',
                    'seconds_left' => max(0, (int)$secondsLeft),
                    'next_available_at' => $nextAvailableAt->toIso8601String()
                ], 429);
            }
        }


        $songRequest = SongRequest::create([
            'guest_name' => $request->guest_name,
            'song_data' => $request->song_data,
            'song_title' => $request->song_data['name'],
            'artist' => $request->song_data['artist'],
        ]);

        // Record notification for admin
        \App\Models\Notification::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'type' => 'SongRequested',
            'notifiable_type' => 'App\Models\User',
            'notifiable_id' => 1,
            'data' => [
                'title' => 'New Song Request',
                'message' => "{$songRequest->guest_name} requested '{$songRequest->song_title}'",
                'icon' => 'music'
            ]
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Song request submitted!',
            'song' => $songRequest,
        ], 201);
    }

    /**
     * Mark a song as played (admin)
     */
    public function markPlayed(SongRequest $songRequest)
    {
        $songRequest->update([
            'is_played' => true,
            'played_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Song marked as played',
        ]);
    }

    /**
     * Delete a song request (admin)
     */
    public function destroy(SongRequest $songRequest)
    {
        $songRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Song request removed',
        ]);
    }
}
