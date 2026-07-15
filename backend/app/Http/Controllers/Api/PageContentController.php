<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PageContent;
use App\Traits\ApiResponse;
use App\Traits\NormalizesUrls;
use Illuminate\Http\Request;

class PageContentController extends Controller
{
    use ApiResponse, NormalizesUrls;
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

        return $this->successResponse($items);
    }

    public function show($key)
    {
        $query = PageContent::where('section_key', $key);

        if (!auth('sanctum')->check()) {
            $query->where('is_visible', true);
        }

        $item = $query->first();

        if (!$item) {
            return $this->successResponse([
                'section_key' => $key,
                'content' => (object)[],
                'is_visible' => true,
            ]);
        }

        $item->content = $this->normalizeUrls($item->content);
        
        return $this->successResponse($item);
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

        try {
            event(new \App\Events\PageContentUpdated($content));
        } catch (\Exception $e) {
            // Broadcast failure (e.g. Reverb not running) — log but don't break the update
            \Log::warning('Broadcast failed for PageContentUpdated: ' . $e->getMessage());
        }

        return $this->successResponse($content);
    }
}
