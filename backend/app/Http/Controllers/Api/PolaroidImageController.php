<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PolaroidImage;
use App\Events\PolaroidImageCreated;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class PolaroidImageController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = PolaroidImage::query();

        if ($request->has('date')) {
            $query->whereDate('taken_at', $request->date);
        }

        return $this->successResponse($query->latest('taken_at')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|max:5120',
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

    public function storeLive(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|max:10240',
            'title' => 'nullable|string|max:255',
            'caption' => 'nullable|string|max:500',
            'taken_at' => 'nullable|date',
            'location' => 'nullable|string|max:255',
        ]);

        $path = $request->file('image')->store('polaroids', 'public');

        $polaroid = PolaroidImage::create([
            'image_path' => '/storage/' . $path,
            'title' => $request->title,
            'caption' => $request->caption,
            'taken_at' => $request->taken_at ?? now(),
            'location' => $request->location,
        ]);

        event(new PolaroidImageCreated($polaroid));

        return $this->createdResponse($polaroid);
    }

    public function update(Request $request, PolaroidImage $polaroid): JsonResponse
    {
        $polaroid->update($request->only([
            'title',
            'caption',
            'note',
            'custom_size',
            'offset_x',
            'offset_y',
            'rotation',
            'location',
            'taken_at',
        ]));

        return $this->successResponse($polaroid);
    }

    public function destroy(PolaroidImage $polaroid): JsonResponse
    {
        $relativePath = str_replace('/storage/', '', $polaroid->image_path);

        if (Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }

        $polaroid->delete();

        return $this->deletedResponse('Deleted successfully');
    }
}
