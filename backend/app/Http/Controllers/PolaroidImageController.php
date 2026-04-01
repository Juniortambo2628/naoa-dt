<?php

namespace App\Http\Controllers;

use App\Models\PolaroidImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PolaroidImageController extends Controller
{
    public function index()
    {
        return response()->json(PolaroidImage::latest()->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:5120', // 5MB max
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('polaroids', 'public');
            
            $polaroid = PolaroidImage::create([
                'image_path' => '/storage/' . $path
            ]);

            return response()->json($polaroid, 201);
        }

        return response()->json(['error' => 'No image uploaded'], 400);
    }

    public function update(Request $request, $id)
    {
        $polaroid = PolaroidImage::findOrFail($id);
        
        $polaroid->update($request->only([
            'note', 
            'custom_size', 
            'offset_x', 
            'offset_y', 
            'rotation',
            'location'
        ]));

        return response()->json($polaroid);
    }

    public function destroy($id)
    {
        $polaroid = PolaroidImage::findOrFail($id);
        
        // Remove /storage/ prefix to delete from disk
        $relativePath = str_replace('/storage/', '', $polaroid->image_path);
        
        if (Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }
        
        $polaroid->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
