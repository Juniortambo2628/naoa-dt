<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\GuestbookEntryResource;
use App\Models\GuestbookEntry;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GuestbookController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $entries = GuestbookEntry::where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'entries' => GuestbookEntryResource::collection($entries),
            'total'   => $entries->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'guest_name' => 'required|string|max:100',
            'message'    => 'required|string|max:1000',
        ]);

        $entry = GuestbookEntry::create([
            'guest_name'  => $request->guest_name,
            'message'     => $request->message,
            'is_approved' => true,
        ]);

        return $this->createdResponse(
            new GuestbookEntryResource($entry),
            'Your message has been added!'
        );
    }

    public function approve(GuestbookEntry $guestbookEntry): JsonResponse
    {
        $guestbookEntry->update(['is_approved' => true]);

        return $this->successResponse(
            new GuestbookEntryResource($guestbookEntry),
            'Entry approved'
        );
    }

    public function destroy(GuestbookEntry $guestbookEntry): JsonResponse
    {
        $guestbookEntry->delete();

        return $this->deletedResponse('Entry deleted');
    }
}
