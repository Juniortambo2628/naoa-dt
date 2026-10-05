<?php

namespace App\Services;

use App\Mail\AdminRSVPNotification;
use App\Mail\RSVPConfirmation;
use App\Models\Guest;
use App\Models\Notification;
use App\Models\Setting;
use App\Models\SongRequest;
use App\Traits\AdminNotifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class GuestService
{
    use AdminNotifiable;

    /**
     * Submit an RSVP for a given guest
     *
     * @return array ['success' => bool, 'message' => string, 'error' => string|null]
     */
    public function submitRsvp(Guest $guest, array $data): array
    {
        $plusOnes = min($data['plus_ones_count'] ?? 0, $guest->plus_ones_allowed);

        try {
            DB::transaction(function () use ($guest, $data) {
                $status = $data['attending'] ? 'confirmed' : 'declined';

                // Update primary guest status
                $guest->update([
                    'rsvp_status' => $status,
                    'rsvp_message' => $data['message'] ?? null,
                    'dietary_notes' => $data['dietary_notes'] ?? null,
                ]);

                // Handle Song Request
                if (! empty($data['song_request'])) {
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
                    ]);
                }

                // Update plus-ones status and names
                $plusOnesData = $data['plus_ones_data'] ?? [];
                foreach ($guest->plusOnes as $index => $po) {
                    $updateData = [
                        'rsvp_status' => $status,
                        'dietary_notes' => $data['dietary_notes'] ?? null,
                    ];

                    // Update name if provided in plus_ones_data array
                    if (isset($plusOnesData[$index]['name']) && ! empty($plusOnesData[$index]['name'])) {
                        $updateData['name'] = $plusOnesData[$index]['name'];
                    }

                    $po->update($updateData);

                    if ($po->invitation) {
                        $po->invitation->update(['status' => 'responded']);
                    }
                }
            });
        } catch (\Exception $e) {
            Log::error('RSVP Submission Error: '.$e->getMessage());
            Log::error($e->getTraceAsString());

            return ['success' => false, 'message' => 'Internal Server Error', 'error' => $e->getMessage()];
        }

        // Send confirmation email to guest (non-blocking)
        try {
            if ($guest->email) {
                Mail::to($guest->email)->send(new RSVPConfirmation($guest, $data['attending']));
            }
        } catch (\Exception $e) {
            Log::warning('RSVP confirmation email failed for guest '.$guest->name.': '.$e->getMessage());
        }

        // Send notification email to admin if enabled
        try {
            $adminNotify = Setting::getValue('admin_email_notifications', 'false');
            if (filter_var($adminNotify, FILTER_VALIDATE_BOOLEAN)) {
                // Fall back to the configured from-address when no recipient is set
                // (getValue returns an empty string when the row exists but is blank).
                $adminEmail = Setting::getValue('admin_email') ?: config('mail.from.address');

                if (! empty($adminEmail)) {
                    Mail::to($adminEmail)->send(new AdminRSVPNotification(
                        $guest,
                        (bool) ($data['attending'] ?? false),
                        $plusOnes,
                        $data['message'] ?? null,
                        $this->formatSongRequest($data['song_request'] ?? null)
                    ));
                } else {
                    Log::warning('RSVP admin notification skipped: notifications enabled but no recipient configured.');
                }
            }
        } catch (\Throwable $e) {
            Log::warning('RSVP admin notification email failed: '.$e->getMessage());
        }

        // Record notification for admin in database
        $this->notifyAdmin(
            'App\Notifications\RSVPReceived',
            'New RSVP: '.$guest->name,
            $guest->name.' has '.($data['attending'] ? 'confirmed their attendance.' : 'respectfully declined.'),
            'rsvp',
            [
                'guest_id' => $guest->id,
                'attending' => $data['attending'],
                'plus_ones' => $plusOnes,
            ]
        );

        return ['success' => true, 'message' => 'RSVP submitted successfully'];
    }

    /**
     * Turn a raw RSVP song_request value into a human-readable label.
     *
     * The guest form sends either a plain string or a "spotify:" prefixed
     * JSON payload (track name + artist).
     */
    private function formatSongRequest(?string $songRequest): ?string
    {
        if (empty($songRequest)) {
            return null;
        }

        if (str_starts_with($songRequest, 'spotify:')) {
            $json = json_decode(substr($songRequest, 8), true);

            if (json_last_error() === JSON_ERROR_NONE && ! empty($json['name'])) {
                return trim($json['name'].(! empty($json['artist']) ? ' — '.$json['artist'] : ''));
            }

            return null;
        }

        return $songRequest;
    }
}
