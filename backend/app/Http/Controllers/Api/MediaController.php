<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use App\Traits\NormalizesUrls;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    use ApiResponse, NormalizesUrls;
    public function upload(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:10240', // Max 10MB
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
            
            $file->move(public_path('uploads'), $filename);

            $url = '/uploads/' . $filename;

            return $this->successResponse([
                'url' => $url,
            ], 'Image uploaded successfully');
        }

        return $this->errorResponse('No image uploaded', 400);
    }
}
