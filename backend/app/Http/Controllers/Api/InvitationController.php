<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guest;
use App\Models\Invitation;
use App\Mail\InvitationEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    /**
     * Send invitation to a specific guest and their plus ones
     */
    public function send(Request $request, Guest $guest)
    {
        if (!$guest->email) {
            return response()->json(['message' => 'Guest has no email address'], 422);
        }

        $imageData = $request->input('image_data');
        $attachmentPath = null;
        
        if ($imageData && str_contains($imageData, 'base64')) {
            try {
                $attachmentPath = $this->saveTempImage($imageData, $guest);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to save invitation image: " . $e->getMessage());
            }
        }

        $sentCount = 0;
        $guestsToInvite = collect([$guest])->merge($guest->plusOnes()->whereNotNull('email')->get());

        foreach ($guestsToInvite as $invitee) {
            /** @var \App\Models\Guest $invitee */
            if (!$invitee->email) continue;
            
            // Ensure invitation record exists
            $invitation = $invitee->invitation ?? Invitation::create([
                'guest_id' => $invitee->id,
                'status' => 'pending',
                'token' => Str::random(32),
            ]);

            try {
                Mail::to($invitee->email)->send(new InvitationEmail($invitee, $attachmentPath));

                $invitation->update([
                    'status' => 'sent',
                    'sent_at' => now(),
                ]);
                $sentCount++;
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Mail fail for guest {$invitee->id}: " . $e->getMessage());
            }
        }

        return response()->json([
            'message' => "Sent {$sentCount} invitation(s) successfully",
            'sent_count' => $sentCount,
        ]);
    }

    private function saveTempImage($base64String, $guest)
    {
        $data = explode(',', $base64String);
        if (count($data) < 2) return null;
        
        $decodedData = base64_decode($data[1]);
        $fileName = 'invitations/invitation_' . $guest->id . '_' . time() . '.png';
        
        \Illuminate\Support\Facades\Storage::disk('public')->put($fileName, $decodedData);
        
        return \Illuminate\Support\Facades\Storage::disk('public')->path($fileName);
    }

    /**
     * Send bulk invitations
     */
    public function sendBulk(Request $request)
    {
        $request->validate([
            'guest_ids' => 'required|array',
            'guest_ids.*' => 'exists:guests,id',
        ]);

        $count = 0;
        $errors = 0;

        $guests = Guest::whereIn('id', $request->guest_ids)->whereNotNull('email')->get();

        foreach ($guests as $guest) {
            /** @var \App\Models\Guest $guest */
            try {
                // Ensure invitation record exists
                $invitation = $guest->invitation ?? Invitation::create([
                    'guest_id' => $guest->id,
                    'status' => 'pending',
                    'token' => Str::random(32),
                ]);

                Mail::to($guest->email)->send(new InvitationEmail($guest));

                $invitation->update([
                    'status' => 'sent',
                    'sent_at' => now(),
                ]);
                $count++;
            } catch (\Exception $e) {
                $errors++;
            }
        }

        return response()->json([
            'message' => "Sent {$count} invitations. {$errors} failed.",
            'sent_count' => $count,
            'error_count' => $errors,
        ]);
    }

    /**
     * Resend invitation
     */
    public function resend(Request $request, Guest $guest)
    {
        return $this->send($request, $guest);
    }
}
