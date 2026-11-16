<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GalleryAlbum;
use App\Models\GalleryItem;
use App\Services\ImageOptimizer;
use App\Traits\ApiResponse;
use App\Traits\NormalizesUrls;
use App\Traits\Reorderable;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GalleryController extends Controller
{
    use ApiResponse, NormalizesUrls, Reorderable;

    public function index()
    {
        $query = GalleryItem::orderBy('order')->orderBy('created_at', 'desc');

        // If not authenticated as admin, show only visible items
        if (! auth('sanctum')->check()) {
            $query->where('is_visible', true);
        }

        $items = $query->get();

        // Normalize URLs: ensure they work with the frontend proxy
        $items->transform(function ($item) {
            $item->image_url = $this->normalizeUrls($item->image_url);
            if ($item->thumb_url) {
                $item->thumb_url = $this->normalizeUrls($item->thumb_url);
            }

            return $item;
        });

        return $this->successResponse($items);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'image_url' => 'required|string',
            'thumb_url' => 'nullable|string',
            'caption' => 'nullable|string',
            'order' => 'integer',
            'is_visible' => 'boolean',
            'is_featured' => 'boolean',
            'gallery_album_id' => 'nullable|integer|exists:gallery_albums,id',
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
            'is_featured' => 'sometimes|boolean',
            'gallery_album_id' => 'sometimes|nullable|integer|exists:gallery_albums,id',
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
     * Bulk import, one photo per request: stores a web-sized copy and a small
     * thumbnail and files it in an album. Sending the same file name to the
     * same album again returns the photo already there, so an import that
     * stopped half way can simply be run again.
     */
    public function import(Request $request)
    {
        $data = $request->validate([
            'image' => ImageOptimizer::RULE,
            'gallery_album_id' => 'nullable|integer|exists:gallery_albums,id',
            'original_name' => 'nullable|string|max:255',
            'taken_at' => 'nullable|date',
            'is_visible' => 'sometimes|boolean',
        ]);

        $albumId = $data['gallery_album_id'] ?? null;
        $originalName = $data['original_name'] ?? $request->file('image')->getClientOriginalName();

        $existing = GalleryItem::where('gallery_album_id', $albumId)->where('original_name', $originalName)->first();
        if ($existing) {
            return $this->successResponse(['item' => $existing, 'skipped' => true], 'Already in the gallery.');
        }

        $upload = $request->file('image');
        $dir = public_path('uploads/gallery');
        if (! is_dir($dir.'/thumbs')) {
            mkdir($dir.'/thumbs', 0755, true);
        }
        $base = time().'_'.Str::random(10);

        $large = ImageOptimizer::optimize($upload);
        $largeName = $base.'.'.($large->guessExtension() ?: 'jpg');
        $large->move($dir, $largeName);

        $thumb = ImageOptimizer::optimize($upload, 640, 76);
        $thumbName = $base.'.'.($thumb->guessExtension() ?: 'jpg');
        $thumb->move($dir.'/thumbs', $thumbName);

        [$width, $height] = @getimagesize($dir.'/'.$largeName) ?: [null, null];

        $item = GalleryItem::create([
            'image_url' => '/uploads/gallery/'.$largeName,
            'thumb_url' => '/uploads/gallery/thumbs/'.$thumbName,
            'gallery_album_id' => $albumId,
            'original_name' => $originalName,
            'taken_at' => $data['taken_at'] ?? null,
            'width' => $width,
            'height' => $height,
            'is_visible' => $data['is_visible'] ?? true,
            'order' => 0,
        ]);

        return $this->createdResponse(['item' => $item, 'skipped' => false], 'Photo added.');
    }

    /** Albums, in the order the events happened, with how many photos each holds. */
    public function albums()
    {
        $admin = auth('sanctum')->check();
        $albums = GalleryAlbum::chronological()
            ->withCount(['items as photo_count' => fn ($q) => $admin ? $q : $q->where('is_visible', true)])
            ->get();

        return $this->successResponse($albums);
    }

    public function storeAlbum(Request $request)
    {
        $album = GalleryAlbum::create($this->albumData($request));

        return $this->createdResponse($album);
    }

    public function updateAlbum(Request $request, GalleryAlbum $album)
    {
        $album->update($this->albumData($request, true));

        return $this->successResponse($album);
    }

    /** Removing an album keeps its photos; they just no longer belong to it. */
    public function destroyAlbum(GalleryAlbum $album)
    {
        GalleryItem::where('gallery_album_id', $album->id)->update(['gallery_album_id' => null]);
        $album->delete();

        return $this->deletedResponse('Album removed. Its photos are still in the gallery.');
    }

    private function albumData(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes|required' : 'required';

        return $request->validate([
            'title' => $required.'|string|max:120',
            'subtitle' => 'nullable|string|max:160',
            'event_date' => 'nullable|date',
            'order' => 'sometimes|integer',
        ]);
    }

    /**
     * Guest photo upload
     */
    public function guestUpload(Request $request)
    {
        $request->validate([
            'image' => ImageOptimizer::RULE,
            'guest_name' => 'required|string|max:100',
            'caption' => 'nullable|string|max:255',
        ]);

        // Store directly under public/ (same as MediaController) so the file is
        // served without relying on the storage symlink or APP_URL host.
        $file = ImageOptimizer::optimize($request->file('image'));
        $filename = time().'_'.Str::random(10).'.'.($file->guessExtension() ?: 'jpg');
        $file->move(public_path('uploads/guest-uploads'), $filename);
        $url = '/uploads/guest-uploads/'.$filename;

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
