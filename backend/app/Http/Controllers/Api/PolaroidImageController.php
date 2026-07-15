<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PolaroidImage;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class PolaroidImageController extends Controller
{
    use ApiResponse;

    public function index()
    {
        return $this->successResponse(PolaroidImage::latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|max:5120', // 5MB max
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('polaroids', 'public');

            $polaroid = PolaroidImage::create([
                'image_path' => '/storage/' . $path
            ]);

            return $this->createdResponse($polaroid);
        }

        return $this->errorResponse('No image uploaded', 400);
    }

    public function update(Request $request, PolaroidImage $polaroid): JsonResponse
    {
        $polaroid->update($request->only([
            'note',
            'custom_size',
            'offset_x',
            'offset_y',
            'rotation',
            'location'
        ]));

        return $this->successResponse($polaroid);
    }

    public function destroy(PolaroidImage $polaroid): JsonResponse
    {
        // Remove /storage/ prefix to delete from disk
        $relativePath = str_replace('/storage/', '', $polaroid->image_path);

        if (Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }

        $polaroid->delete();

        return $this->deletedResponse('Deleted successfully');
    }
}
