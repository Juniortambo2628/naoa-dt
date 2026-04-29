<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PageContent;
use Illuminate\Http\Request;

class PageContentController extends Controller
{
    public function index()
    {
        $query = PageContent::query();

        // If not authenticated as admin, show only visible items
        if (!auth('sanctum')->check()) {
            $query->where('is_visible', true);
        }

        $items = $query->get()->keyBy('section_key');
        
        // Normalize URLs in content
        $items->transform(function($item) {
            $item->content = $this->normalizeUrls($item->content);
            return $item;
        });

        return response()->json($items);
    }

    public function show($key)
    {
        $query = PageContent::where('section_key', $key);

        if (!auth('sanctum')->check()) {
            $query->where('is_visible', true);
        }

        $item = $query->first();

        if (!$item) {
            return response()->json([
                'section_key' => $key,
                'content' => (object)[],
                'is_visible' => true,
            ]);
        }

        $item->content = $this->normalizeUrls($item->content);
        
        return response()->json($item);
    }

    private function normalizeUrls($data)
    {
        if (is_string($data)) {
            if (str_contains($data, 'localhost') || str_contains($data, '127.0.0.1')) {
                 $parsed = parse_url($data);
                 if (isset($parsed['path'])) {
                     $path = $parsed['path'];
                     $prefix = '/wed-dt/backend/public';
                     if (str_starts_with($path, $prefix)) {
                         $path = substr($path, strlen($prefix));
                     }
                     return $path;
                 }
            }
            return $data;
        }

        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = $this->normalizeUrls($value);
            }
        }

        return $data;
    }

    public function update(Request $request, $key)
    {
        $request->validate([
            'content' => 'nullable|array',
            'is_visible' => 'boolean'
        ]);

        $content = PageContent::updateOrCreate(
            ['section_key' => $key],
            [
                'content' => $request->input('content'),
                'is_visible' => $request->input('is_visible', true)
            ]
        );

        event(new \App\Events\PageContentUpdated($content));

        return response()->json($content);
    }
}
