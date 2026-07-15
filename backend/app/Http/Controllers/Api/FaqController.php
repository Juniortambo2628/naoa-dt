<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Traits\Reorderable;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FaqController extends Controller
{
    use Reorderable, ApiResponse;

    public function index()
    {
        return response()->json(Faq::orderBy('order')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'answer'   => 'required|string',
            'order'    => 'integer',
        ]);

        if (!isset($validated['order'])) {
            $validated['order'] = Faq::max('order') + 1;
        }

        $faq = Faq::create($validated);

        return $this->createdResponse($faq);
    }

    public function update(Request $request, Faq $faq): JsonResponse
    {
        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'answer'   => 'required|string',
            'order'    => 'integer',
        ]);

        $faq->update($validated);

        return $this->successResponse($faq);
    }

    public function destroy(Faq $faq): JsonResponse
    {
        $faq->delete();

        return $this->deletedResponse('FAQ deleted');
    }

    public function reorder(Request $request)
    {
        return $this->reorderItems(Faq::class, $request, 'faqs');
    }
}
