<?php

namespace App\Services;

use App\Mail\InvitationEmail;
use App\Models\Guest;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class InvitationService
{
    /**
     * Send an invitation to a single guest (including their plus-ones with emails).
     *
     * @param  string|null  $attachmentPath  Optional filesystem path to an image attachment
     * @return array{sent_count: int, error_count: int}
     */
    public function sendToGuest(Guest $guest, ?string $attachmentPath = null): array
    {
        $sent = 0;
        $errors = 0;

        $guestsToInvite = collect([$guest])
            ->merge($guest->plusOnes()->whereNotNull('email')->get());

        foreach ($guestsToInvite as $invitee) {
            if (! $invitee->email) {
                continue;
            }

            $invitation = $invitee->createPendingInvitation();

            try {
                Mail::to($invitee->email)->send(new InvitationEmail($invitee, $attachmentPath));
                $invitation->markAsSent();
                $sent++;
            } catch (\Exception $e) {
                $errors++;
                Log::error("Mail fail for guest {$invitee->id}: ".$e->getMessage());
            }
        }

        return ['sent_count' => $sent, 'error_count' => $errors];
    }

    /**
     * Send invitations to many guests.
     *
     * @param  array<int>  $guestIds
     * @return array{sent_count: int, error_count: int}
     */
    public function sendBulk(array $guestIds): array
    {
        $sent = 0;
        $errors = 0;

        $guests = Guest::whereIn('id', $guestIds)
            ->whereNotNull('email')
            ->get();

        foreach ($guests as $guest) {
            $result = $this->sendToGuest($guest);
            $sent += $result['sent_count'];
            $errors += $result['error_count'];
        }

        return ['sent_count' => $sent, 'error_count' => $errors];
    }

    /**
     * Persist a base64-encoded attachment (PDF or image) to temporary storage.
     *
     * @param  string  $extension  File extension to store under (e.g. 'pdf', 'png')
     * @return string|null Filesystem path, or null on failure
     */
    public function saveTempAttachment(string $base64String, Guest $guest, string $extension = 'png'): ?string
    {
        if (! str_contains($base64String, 'base64')) {
            return null;
        }

        $data = explode(',', $base64String);
        if (count($data) < 2) {
            return null;
        }

        $decodedData = base64_decode($data[1]);
        $fileName = 'invitations/invitation_'.$guest->id.'_'.time().'.'.$extension;

        Storage::disk('public')->put($fileName, $decodedData);

        return Storage::disk('public')->path($fileName);
    }

    /**
     * Store a base64-encoded invitation PDF on the public disk under a
     * hard-to-guess name and return its public URL (used for WhatsApp invites).
     */
    public function savePublicPdf(string $base64String, Guest $guest): ?string
    {
        $data = explode(',', $base64String, 2);
        if (count($data) < 2) {
            return null;
        }

        $slug = Str::slug($guest->name) ?: 'guest';
        $fileName = 'invitations/whatsapp/'.$slug.'_'.Str::random(24).'.pdf';

        Storage::disk('public')->put($fileName, base64_decode($data[1]));

        return Storage::disk('public')->url($fileName);
    }

    /**
     * Backward-compatible alias for saving a base64 PNG attachment.
     *
     * @return string|null Filesystem path, or null on failure
     */
    public function saveTempImage(string $base64String, Guest $guest): ?string
    {
        return $this->saveTempAttachment($base64String, $guest, 'png');
    }
}
