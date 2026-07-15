<?php

namespace App\Services;

use App\Imports\GuestsImport;
use App\Models\Guest;
use App\Models\Invitation;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

class GuestImportService
{
    /**
     * Import guests from an Excel file using the standard import class.
     */
    public function import(UploadedFile $file): void
    {
        Excel::import(new GuestsImport, $file);
    }

    /**
     * Validate an import file and return conflicts, valid rows, and skipped count.
     *
     * @return array{conflicts: array, valid: array, skipped_count: int}
     */
    public function validateImport(UploadedFile $file): array
    {
        $data = Excel::toArray(new GuestsImport, $file);
        $rows = $data[0] ?? [];

        $conflicts = [];
        $valid = [];
        $skippedCount = 0;

        foreach ($rows as $row) {
            if (empty($row['names']) && empty($row['name'])) {
                $skippedCount++;
                continue;
            }

            $name = trim($row['names'] ?? $row['name'] ?? '');
            $email = !empty($row['email']) ? trim($row['email']) : null;
            $phone = !empty($row['telphone_number']) ? trim($row['telphone_number']) : null;
            $method = !empty($row['save_the_date_sent_via_whatsappemail']) ? trim($row['save_the_date_sent_via_whatsappemail']) : null;
            $invitation_via = !empty($row['invitation_via']) ? trim($row['invitation_via']) : null;
            $group = !empty($row['group']) ? trim($row['group']) : 'Invited';
            $plusOnes = max(0, ((int)($row['number_of_invites'] ?? 1)) - 1);

            $existing = $this->findExistingGuest($name, $email);

            $newGuestData = [
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'plus_ones_allowed' => $plusOnes,
                'save_the_date_method' => $method,
                'invitation_via' => $invitation_via,
                'group' => $group,
                'rsvp_status' => 'pending',
            ];

            if ($existing) {
                $isDifferent = (
                    $existing->name != $name ||
                    $existing->email != $email ||
                    $existing->phone != $phone ||
                    $existing->plus_ones_allowed != $plusOnes ||
                    $existing->save_the_date_method != $method
                );

                if ($isDifferent) {
                    $conflicts[] = [
                        'existing' => $existing,
                        'new' => $newGuestData,
                    ];
                } else {
                    $skippedCount++;
                }
            } else {
                $valid[] = $newGuestData;
            }
        }

        return [
            'conflicts' => $conflicts,
            'valid' => $valid,
            'skipped_count' => $skippedCount,
        ];
    }

    /**
     * Finalize import with user resolutions for conflicts.
     *
     * @param array $valid
     * @param array $conflicts
     * @return array{created: int, updated: int, skipped: int}
     */
    public function confirmImport(array $valid, array $conflicts): array
    {
        $results = ['created' => 0, 'updated' => 0, 'skipped' => 0];

        DB::transaction(function () use ($valid, $conflicts, &$results) {
            foreach ($valid as $data) {
                $this->createGuestWithPlusOnes($data, $results);
            }

            foreach ($conflicts as $conflict) {
                $this->resolveConflict($conflict, $results);
            }
        });

        return $results;
    }

    /**
     * Find an existing guest by email or name.
     */
    private function findExistingGuest(string $name, ?string $email): ?Guest
    {
        if ($email) {
            $existing = Guest::where('email', $email)->first();
            if ($existing) {
                return $existing;
            }
        }

        return Guest::where('name', $name)->first();
    }

    /**
     * Create a primary guest plus dedicated plus-one records.
     */
    private function createGuestWithPlusOnes(array $data, array &$results): void
    {
        $plusOnesCount = (int)($data['plus_ones_allowed'] ?? 0);

        $guest = Guest::create($data + [
            'plus_ones_allowed' => 0,
            'rsvp_status' => 'pending',
        ]);
        Invitation::create(['guest_id' => $guest->id, 'status' => 'pending']);
        $results['created']++;

        for ($i = 1; $i <= $plusOnesCount; $i++) {
            $po = Guest::create([
                'name' => $guest->name . ' (Plus One ' . $i . ')',
                'group' => $guest->group,
                'parent_guest_id' => $guest->id,
                'plus_ones_allowed' => 0,
                'rsvp_status' => 'pending',
            ]);
            Invitation::create(['guest_id' => $po->id, 'status' => 'pending']);
            $results['created']++;
        }
    }

    /**
     * Apply a user resolution (overwrite/merge/skip) to a conflict.
     */
    private function resolveConflict(array $conflict, array &$results): void
    {
        $resolution = $conflict['resolution'] ?? 'skip';
        $existingId = $conflict['existing']['id'] ?? null;

        if (!$existingId) {
            $results['skipped']++;
            return;
        }

        $guest = Guest::find($existingId);
        if (!$guest) {
            $results['skipped']++;
            return;
        }

        if ($resolution === 'overwrite') {
            $guest->update($conflict['new']);
            $results['updated']++;
        } elseif ($resolution === 'merge') {
            $guest->update(array_filter($conflict['new']));
            $results['updated']++;
        } else {
            $results['skipped']++;
        }
    }
}
