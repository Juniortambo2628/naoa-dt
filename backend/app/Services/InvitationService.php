<?php

namespace App\Services;

use App\Mail\InvitationEmail;
use App\Models\Guest;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class InvitationService
{
    /**
     * Send an invitation to a single guest (including their plus-ones with emails).
     *
     * @param Guest $guest
     * @param string|null $attachmentPath Optional filesystem path to an image attachment
     * @return array{sent_count: int, error_count: int}
     */
    public function sendToGuest(Guest $guest, ?string $attachmentPath = null): array
    {
        $sent = 0;
        $errors = 0;

        $guestsToInvite = collect([$guest])
            ->merge($guest->plusOnes()->whereNotNull('email')->get());

        foreach ($guestsToInvite as $invitee) {
            if (!$invitee->email) {
                continue;
            }

            $invitation = $invitee->createPendingInvitation();

            try {
                Mail::to($invitee->email)->send(new InvitationEmail($invitee, $attachmentPath));
                $invitation->markAsSent();
                $sent++;
            } catch (\Exception $e) {
                $errors++;
                Log::error("Mail fail for guest {$invitee->id}: " . $e->getMessage());
            }
        }

        return ['sent_count' => $sent, 'error_count' => $errors];
    }

    /**
     * Send invitations to many guests.
     *
     * @param array<int> $guestIds
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
     * Persist a base64 image to temporary storage for attachment.
     *
     * @param string $base64String
     * @param Guest $guest
     * @return string|null Filesystem path, or null on failure
     */
    public function saveTempImage(string $base64String, Guest $guest): ?string
    {
        if (!str_contains($base64String, 'base64')) {
            return null;
        }

        $data = explode(',', $base64String);
        if (count($data) < 2) {
            return null;
        }

        $decodedData = base64_decode($data[1]);
        $fileName = 'invitations/invitation_' . $guest->id . '_' . time() . '.png';

        Storage::disk('public')->put($fileName, $decodedData);

        return Storage::disk('public')->path($fileName);
    }
}
