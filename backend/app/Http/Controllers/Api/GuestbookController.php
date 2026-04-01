<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GuestbookEntry;
use Illuminate\Http\Request;

class GuestbookController extends Controller
{
    /**
     * Get all approved guestbook entries
     */
    public function index()
    {
        $entries = GuestbookEntry::where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($entry) {
                return [
                    'id' => $entry->id,
                    'guest_name' => $entry->guest_name,
                    'message' => $entry->message,
                    'created_at' => $entry->created_at->format('M d, Y'),
                    'time_ago' => $entry->created_at->diffForHumans(),
                ];
            });

        return response()->json([
            'entries' => $entries,
            'total' => $entries->count(),
        ]);
    }

    /**
     * Store a new guestbook entry
     */
    public function store(Request $request)
    {
        $request->validate([
            'guest_name' => 'required|string|max:100',
            'message' => 'required|string|max:1000',
        ]);

        $entry = GuestbookEntry::create([
            'guest_name' => $request->guest_name,
            'message' => $request->message,
            'is_approved' => true, // Show immediately
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your message has been added!',
            'entry' => $entry,
        ], 201);
    }

    /**
     * Delete an entry (admin)
     */
    public function destroy(GuestbookEntry $guestbookEntry)
    {
        $guestbookEntry->delete();

        return response()->json([
            'success' => true,
            'message' => 'Entry deleted',
        ]);
    }
}
