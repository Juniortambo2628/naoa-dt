<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enquiry;
use App\Mail\EnquiryReceived;
use App\Mail\EnquiryReplied;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\Request;

class EnquiryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Enquiry::orderBy('created_at', 'desc')->paginate(20);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'type' => 'nullable|in:guest,vendor,other',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string',
        ]);

        $enquiry = Enquiry::create($validated);

        // Send email to admin
        try {
            Mail::to('tangtzeren@gmail.com')->send(new EnquiryReceived($enquiry));
        } catch (\Exception $e) {
            \Log::error('Failed to send enquiry email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Your message has been sent successfully!',
            'enquiry' => $enquiry
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return Enquiry::findOrFail($id);
    }

    /**
     * Reply to the enquiry.
     */
    public function reply(Request $request, string $id)
    {
        $enquiry = Enquiry::findOrFail($id);

        $request->validate([
            'message' => 'required|string',
        ]);

        $replyMessage = $request->input('message');

        // Send email to user
        try {
            Mail::to($enquiry->email)->send(new EnquiryReplied($enquiry, $replyMessage));
            
            $enquiry->update([
                'reply_message' => $replyMessage,
                'replied_at' => now(),
                'status' => 'replied'
            ]);

            return response()->json([
                'message' => 'Reply sent successfully!',
                'enquiry' => $enquiry
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to send reply email: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to send email'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $enquiry = Enquiry::findOrFail($id);
        $enquiry->delete();

        return response()->json(['message' => 'Enquiry deleted successfully']);
    }
}
