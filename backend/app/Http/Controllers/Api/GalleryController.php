<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GalleryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GalleryController extends Controller
{
    public function index()
    {
        $query = GalleryItem::orderBy('order')->orderBy('created_at', 'desc');

        // If not authenticated as admin, show only visible items
        if (!auth('sanctum')->check()) {
            $query->where('is_visible', true);
        }

        $items = $query->get();

        // Normalize URLs: ensure they work with the frontend proxy
        $items->transform(function($item) {
            $url = $item->image_url;
            
            // If it's a full URL containing localhost or current host, make it relative
            if (str_contains($url, '://')) {
                $parsed = parse_url($url);
                if (isset($parsed['host']) && (str_contains($parsed['host'], 'localhost') || $parsed['host'] === request()->getHost())) {
                    $path = $parsed['path'] ?? '';
                    // Strip the WAMP specific prefix if it exists
                    $prefix = '/wed-dt/backend/public';
                    if (str_starts_with($path, $prefix)) {
                        $path = substr($path, strlen($prefix));
                    }
                    $url = $path;
                }
            }
            
            $item->image_url = $url;
            return $item;
        });

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'image_url' => 'required|string',
            'caption' => 'nullable|string',
            'order' => 'integer',
            'is_visible' => 'boolean'
        ]);

        $item = GalleryItem::create($data);
        return response()->json($item, 201);
    }

    public function update(Request $request, GalleryItem $galleryItem)
    {
        $galleryItem->update($request->all());
        return response()->json($galleryItem);
    }

    public function destroy(GalleryItem $galleryItem)
    {
        $galleryItem->delete();
        return response()->json(['message' => 'Item deleted']);
    }

    /**
     * Reorder gallery items
     */
    public function reorder(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:gallery_items,id',
            'items.*.order' => 'required|integer',
        ]);

        foreach ($request->items as $item) {
            GalleryItem::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return response()->json(['message' => 'Gallery reordered successfully']);
    }

    /**
     * Guest photo upload
     */
    public function guestUpload(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:5120', // 5MB max
            'guest_name' => 'required|string|max:100',
            'caption' => 'nullable|string|max:255',
        ]);

        // Store the image
        $path = $request->file('image')->store('gallery/guest-uploads', 'public');
        $url = Storage::url($path);

        // Create gallery item
        $item = GalleryItem::create([
            'image_url' => $url,
            'caption' => $request->caption,
            'uploaded_by' => $request->guest_name,
            'is_guest_upload' => true,
            'is_visible' => true,
            'order' => 999, // Guest uploads at end
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Photo uploaded successfully!',
            'item' => $item,
        ], 201);
    }
}
