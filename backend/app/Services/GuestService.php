<?php

namespace App\Services;

use App\Models\Guest;
use App\Models\RsvpResponse;
use App\Models\SongRequest;
use App\Models\Notification;
use App\Mail\RSVPConfirmation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class GuestService
{
    /**
     * Submit an RSVP for a given guest
     * 
     * @return array ['success' => bool, 'message' => string, 'error' => string|null]
     */
    public function submitRsvp(Guest $guest, array $data): array
    {
        $plusOnes = min($data['plus_ones_count'] ?? 0, $guest->plus_ones_allowed);

        try {
            DB::transaction(function () use ($guest, $data, $plusOnes) {
                $status = $data['attending'] ? 'confirmed' : 'declined';
                
                // Update primary guest status
                $guest->update([
                    'rsvp_status' => $status,
                    'confirmed_plus_ones' => $plusOnes,
                ]);

                // Create or update response
                RsvpResponse::updateOrCreate(
                    ['guest_id' => $guest->id],
                    [
                        'attending' => $data['attending'],
                        'plus_ones_count' => $plusOnes,
                        'message' => $data['message'] ?? null,
                    ]
                );

                // Handle Song Request
                if (!empty($data['song_request'])) {
                    $songData = $data['song_request'];
                    if (str_starts_with($songData, 'spotify:')) {
                        $json = json_decode(substr($songData, 8), true);
                        SongRequest::create([
                            'guest_name' => $guest->name, 
                            'song_data' => $json,
                            'song_title' => $json['name'] ?? 'Unknown',
                            'artist' => $json['artist'] ?? 'Unknown',
                        ]);
                    } else {
                        SongRequest::create([
                            'guest_name' => $guest->name,
                            'song_title' => $songData,
                            'artist' => 'Requested via RSVP',
                        ]);
                    }
                }

                // Update invitation status
                if ($guest->invitation) {
                    $guest->invitation->update([
                        'status' => 'responded',
                        'responded_at' => now(),
                    ]);
                }

                // Update plus-ones status
                foreach ($guest->plusOnes as $po) {
                    $po->update(['rsvp_status' => $status]);
                    
                    RsvpResponse::updateOrCreate(
                        ['guest_id' => $po->id],
                        [
                            'attending' => $data['attending'],
                            'plus_ones_count' => 0,
                        ]
                    );

                    if ($po->invitation) {
                        $po->invitation->update(['status' => 'responded']);
                    }
                }
            });
        } catch (\Exception $e) {
            Log::error('RSVP Submission Error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return ['success' => false, 'message' => 'Internal Server Error', 'error' => $e->getMessage()];
        }

        // Send confirmation email (non-blocking)
        try {
            if ($guest->email) {
                Mail::to($guest->email)->send(new RSVPConfirmation($guest, $data['attending']));
            }
        } catch (\Exception $e) {
            Log::warning('RSVP email failed for guest ' . $guest->name . ': ' . $e->getMessage());
        }

        // Record notification for admin
        try {
            Notification::create([
                'title' => 'New RSVP: ' . $guest->name,
                'message' => $guest->name . ' has ' . ($data['attending'] ? 'confirmed their attendance.' : 'respectfully declined.'),
                'type' => 'rsvp',
                'meta_data' => [
                    'guest_id' => $guest->id,
                    'attending' => $data['attending'],
                    'plus_ones' => $plusOnes,
                ]
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to create RSVP notification: ' . $e->getMessage());
        }

        return ['success' => true, 'message' => 'RSVP submitted successfully'];
    }

    /**
     * Bulk update guests
     */
    public function bulkUpdate(array $guestIds, array $data): void
    {
        Guest::whereIn('id', $guestIds)->update($data);
    }
}
