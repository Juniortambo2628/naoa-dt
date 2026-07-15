<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GalleryItem;
use App\Traits\ApiResponse;
use App\Traits\NormalizesUrls;
use App\Traits\Reorderable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GalleryController extends Controller
{
    use ApiResponse, NormalizesUrls, Reorderable;
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
            $item->image_url = $this->normalizeUrls($item->image_url);
            return $item;
        });

        return $this->successResponse($items);
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
        return $this->createdResponse($item);
    }

    public function update(Request $request, GalleryItem $galleryItem)
    {
        $data = $request->validate([
            'image_url' => 'sometimes|string',
            'caption' => 'nullable|string',
            'order' => 'sometimes|integer',
            'is_visible' => 'sometimes|boolean',
            'object_position' => 'sometimes|string',
        ]);

        $galleryItem->update($data);
        return $this->successResponse($galleryItem);
    }

    public function destroy(GalleryItem $galleryItem)
    {
        $galleryItem->delete();
        return $this->deletedResponse('Item deleted');
    }

    /**
     * Reorder gallery items
     */
    public function reorder(Request $request)
    {
        return $this->reorderItems(GalleryItem::class, $request, 'items');
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

        return $this->createdResponse($item, 'Photo uploaded successfully!');
    }
}
