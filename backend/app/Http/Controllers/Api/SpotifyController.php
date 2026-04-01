<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SpotifyController extends Controller
{
    protected $clientId;
    protected $clientSecret;

    public function __construct()
    {
        $this->clientId = config('services.spotify.client_id');
        $this->clientSecret = config('services.spotify.client_secret');
    }

    /**
     * Get Spotify access token (cached for 1 hour)
     */
    protected function getAccessToken()
    {
        return Cache::remember('spotify_access_token', 3500, function () {
            $response = Http::asForm()->withBasicAuth(
                $this->clientId,
                $this->clientSecret
            )->post('https://accounts.spotify.com/api/token', [
                'grant_type' => 'client_credentials'
            ]);

            if ($response->successful()) {
                return $response->json()['access_token'];
            }

            throw new \Exception('Failed to get Spotify access token');
        });
    }

    /**
     * Search for tracks on Spotify
     */
    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:2|max:100'
        ]);

        try {
            $token = $this->getAccessToken();

            $response = Http::withToken($token)
                ->get('https://api.spotify.com/v1/search', [
                    'q' => $request->query('query'),
                    'type' => 'track',
                    'limit' => 10,
                    'market' => 'US'
                ]);

            if ($response->successful()) {
                $tracks = collect($response->json()['tracks']['items'])->map(function ($track) {
                    return [
                        'id' => $track['id'],
                        'name' => $track['name'],
                        'artist' => collect($track['artists'])->pluck('name')->join(', '),
                        'album' => $track['album']['name'],
                        'image' => $track['album']['images'][2]['url'] ?? null, // Small image
                        'preview_url' => $track['preview_url'],
                        'spotify_url' => $track['external_urls']['spotify'],
                        'duration_ms' => $track['duration_ms'],
                    ];
                });

                return response()->json([
                    'success' => true,
                    'tracks' => $tracks
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to search Spotify'
            ], 500);

        } catch (\Exception $e) {
            Log::error('Spotify Search Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Spotify service unavailable'
            ], 503);
        }
    }

    /**
     * Get track details by ID
     */
    public function getTrack($trackId)
    {
        try {
            $token = $this->getAccessToken();

            $response = Http::withToken($token)
                ->get("https://api.spotify.com/v1/tracks/{$trackId}");

            if ($response->successful()) {
                $track = $response->json();
                return response()->json([
                    'success' => true,
                    'track' => [
                        'id' => $track['id'],
                        'name' => $track['name'],
                        'artist' => collect($track['artists'])->pluck('name')->join(', '),
                        'album' => $track['album']['name'],
                        'image' => $track['album']['images'][1]['url'] ?? null,
                        'spotify_url' => $track['external_urls']['spotify'],
                    ]
                ]);
            }

            return response()->json(['success' => false], 404);

        } catch (\Exception $e) {
            Log::error('Spotify GetTrack Error: ' . $e->getMessage());
            return response()->json(['success' => false], 503);
        }
    }
}
