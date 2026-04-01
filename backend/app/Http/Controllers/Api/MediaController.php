<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:10240', // Max 10MB
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
            
            // Store in 'public/uploads'
            // Ensure functionality: php artisan storage:link must be run or we store directly in public
            // For simplicity in WAMP, we can move directly to public_path('uploads') or use Storage::disk('public')
            
            $file->move(public_path('uploads'), $filename);

            // Use relative path for internal proxying
            $url = '/uploads/' . $filename;

            return response()->json([
                'url' => $url,
                'message' => 'Image uploaded successfully'
            ]);
        }

        return response()->json(['message' => 'No image uploaded'], 400);
    }

    private function normalizeUrls($url)
    {
        if (str_contains($url, 'localhost') || str_contains($url, '127.0.0.1')) {
            $parsed = parse_url($url);
            if (isset($parsed['path'])) {
                $path = $parsed['path'];
                $prefix = '/wed-dt/backend/public';
                if (str_starts_with($path, $prefix)) {
                    $path = substr($path, strlen($prefix));
                }
                return $path;
            }
        }
        return $url;
    }
}
