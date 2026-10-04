<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guest;
use App\Services\InvitationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InvitationController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly InvitationService $invitationService
    ) {}

    public function send(Request $request, Guest $guest): JsonResponse
    {
        if (! $guest->email) {
            return $this->errorResponse('Guest has no email address', 422);
        }

        $attachmentPath = null;
        $pdfData = $request->input('pdf_data');
        $imageData = $request->input('image_data');

        try {
            if ($pdfData && str_contains($pdfData, 'base64')) {
                // Preferred: a multi-page PDF with clickable calendar/location links.
                $attachmentPath = $this->invitationService->saveTempAttachment($pdfData, $guest, 'pdf');
            } elseif ($imageData && str_contains($imageData, 'base64')) {
                // Fallback for older clients still sending a single-page PNG.
                $attachmentPath = $this->invitationService->saveTempAttachment($imageData, $guest, 'png');
            }
        } catch (\Exception $e) {
            Log::error('Failed to save invitation attachment: '.$e->getMessage());
        }

        $result = $this->invitationService->sendToGuest($guest, $attachmentPath);

        return $this->successResponse([
            'sent_count' => $result['sent_count'],
        ], "Sent {$result['sent_count']} invitation(s) successfully");
    }

    public function sendBulk(Request $request): JsonResponse
    {
        $request->validate([
            'guest_ids' => 'required|array',
            'guest_ids.*' => 'exists:guests,id',
        ]);

        $result = $this->invitationService->sendBulk($request->guest_ids);

        return $this->successResponse([
            'sent_count' => $result['sent_count'],
            'error_count' => $result['error_count'],
        ], "Sent {$result['sent_count']} invitations. {$result['error_count']} failed.");
    }

    public function resend(Request $request, Guest $guest): JsonResponse
    {
        return $this->send($request, $guest);
    }
}
