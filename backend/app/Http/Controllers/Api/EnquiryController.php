<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enquiry;
use App\Mail\EnquiryReceived;
use App\Mail\EnquiryReplied;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EnquiryController extends Controller
{
    use ApiResponse;

    public function index()
    {
        return Enquiry::orderBy('created_at', 'desc')->paginate(20);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|max:255',
            'type'    => 'nullable|in:guest,vendor,other',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string',
        ]);

        $enquiry = Enquiry::create($validated);

        try {
            Mail::to(config('mail.from.address'))->send(new EnquiryReceived($enquiry));
        } catch (\Exception $e) {
            Log::error('Failed to send enquiry email: ' . $e->getMessage());
        }

        return $this->createdResponse($enquiry, 'Your message has been sent successfully!');
    }

    public function show(string $id)
    {
        return Enquiry::findOrFail($id);
    }

    public function reply(Request $request, string $id): JsonResponse
    {
        $enquiry = Enquiry::findOrFail($id);

        $request->validate([
            'message' => 'required|string',
        ]);

        $replyMessage = $request->input('message');

        try {
            Mail::to($enquiry->email)->send(new EnquiryReplied($enquiry, $replyMessage));
            
            $enquiry->update([
                'reply_message' => $replyMessage,
                'replied_at'    => now(),
                'status'        => 'replied',
            ]);

            return $this->successResponse($enquiry, 'Reply sent successfully!');
        } catch (\Exception $e) {
            Log::error('Failed to send reply email: ' . $e->getMessage());
            return $this->errorResponse('Failed to send email', 500);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        $enquiry = Enquiry::findOrFail($id);
        $enquiry->delete();

        return $this->deletedResponse('Enquiry deleted successfully');
    }
}
