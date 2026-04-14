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
            
            // Store in storage/app/public/uploads/ (served via storage symlink)
            Storage::disk('public')->putFileAs('uploads', $file, $filename);

            // Return the relative path — frontend prepends /storage/ via getAssetUrl
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
