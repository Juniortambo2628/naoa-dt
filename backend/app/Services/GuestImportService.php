<?php

namespace App\Services;

use App\Imports\GuestsImport;
use App\Models\Guest;
use App\Models\Invitation;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class GuestImportService
{
    /**
     * Fields an import may write onto an EXISTING guest. RSVP status/message,
     * dietary notes, RSVP code and invitation status are never touched, so
     * re-importing a spreadsheet can't undo responses or "invited" state.
     */
    private const UPDATABLE_FIELDS = ['name', 'email', 'phone', 'save_the_date_method', 'invitation_via', 'group'];

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
        $rows = $data[$this->guestSheetIndex($file, $data)] ?? [];

        $conflicts = [];
        $valid = [];
        $skippedCount = 0;
        $seen = []; // rows already handled in this file, to drop in-file duplicates

        foreach ($rows as $row) {
            if (empty($row['names']) && empty($row['name'])) {
                // Blank spreadsheet rows aren't "skipped guests"; only count
                // rows that have data but no name.
                if (array_filter($row, fn ($v) => $v !== null && $v !== '')) {
                    $skippedCount++;
                }

                continue;
            }

            $name = trim($row['names'] ?? $row['name'] ?? '');
            $email = ! empty($row['email']) ? trim($row['email']) : null;
            $phone = ! empty($row['telphone_number']) ? trim($row['telphone_number']) : null;
            $method = ! empty($row['save_the_date_sent_via_whatsappemail']) ? trim($row['save_the_date_sent_via_whatsappemail']) : null;
            $invitation_via = ! empty($row['invitation_via']) ? trim($row['invitation_via']) : null;
            $group = ! empty($row['group']) ? trim($row['group']) : 'Invited';
            $plusOnes = max(0, ((int) ($row['number_of_invites'] ?? 1)) - 1);

            $keys = $this->rowKeys($name, $email);
            if (array_intersect($keys, $seen)) {
                $skippedCount++;

                continue;
            }
            array_push($seen, ...$keys);

            $existing = $this->findExistingGuest($name, $email, $phone);

            $newGuestData = [
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'plus_ones_allowed' => $plusOnes,
                'save_the_date_method' => $method,
                'invitation_via' => $invitation_via,
                'group' => $group,
            ];

            if ($existing) {
                $isDifferent = (
                    $existing->name != $name ||
                    $existing->email != $email ||
                    $existing->phone != $phone ||
                    $existing->plusOnes()->count() < $plusOnes ||
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
     * Pick the worksheet holding the guest list: a tab whose name contains
     * "final" (e.g. "Final-guest-list") wins, otherwise the first tab with a
     * Names/Name column, otherwise the first tab.
     */
    private function guestSheetIndex(UploadedFile $file, array $sheets): int
    {
        try {
            $type = \PhpOffice\PhpSpreadsheet\IOFactory::identify($file->getRealPath());
            $names = \PhpOffice\PhpSpreadsheet\IOFactory::createReader($type)->listWorksheetNames($file->getRealPath());
            foreach ($names as $i => $sheetName) {
                if (str_contains(mb_strtolower($sheetName), 'final') && ! empty($sheets[$i])) {
                    return $i;
                }
            }
        } catch (\Throwable) {
            // CSV or unreadable names: fall through to header detection.
        }

        foreach ($sheets as $i => $rows) {
            $first = $rows[0] ?? [];
            if (array_key_exists('names', $first) || array_key_exists('name', $first)) {
                return $i;
            }
        }

        return 0;
    }

    /**
     * Find an existing guest by email, then name — compared case/whitespace-
     * insensitively. Phone is deliberately NOT used: families often share one
     * number. Plus-one records are ignored so "Jane (Plus One 1)" never
     * matches a primary row.
     */
    public function findExistingGuest(string $name, ?string $email, ?string $phone = null): ?Guest
    {
        $primary = fn () => Guest::query()->whereNull('parent_guest_id');

        if ($email) {
            $existing = $primary()->whereRaw('LOWER(TRIM(email)) = ?', [mb_strtolower(trim($email))])->first();
            if ($existing) {
                return $existing;
            }
        }

        $normalized = $this->normalizeName($name);

        return $primary()->get()->first(fn ($g) => $this->normalizeName($g->name) === $normalized);
    }

    private function normalizeName(?string $name): string
    {
        return mb_strtolower(preg_replace('/\s+/', ' ', trim((string) $name)));
    }

    /** Identity keys for in-file duplicate detection. */
    private function rowKeys(string $name, ?string $email): array
    {
        $keys = ['name:'.$this->normalizeName($name)];
        if ($email) {
            $keys[] = 'email:'.mb_strtolower(trim($email));
        }

        return $keys;
    }

    /**
     * Create a primary guest plus dedicated plus-one records.
     */
    private function createGuestWithPlusOnes(array $data, array &$results): void
    {
        $plusOnesCount = (int) ($data['plus_ones_allowed'] ?? 0);

        // Re-check at confirm time so a double submit or a stale preview
        // can't create a second copy of a guest that now exists.
        if ($this->findExistingGuest($data['name'] ?? '', $data['email'] ?? null, $data['phone'] ?? null)) {
            $results['skipped']++;

            return;
        }

        $data = array_intersect_key($data, array_flip([...self::UPDATABLE_FIELDS, 'plus_ones_allowed']));
        $data['plus_ones_allowed'] = 0; // plus-ones get their own records below

        $guest = Guest::create($data + [
            'plus_ones_allowed' => 0,
            'rsvp_status' => 'pending',
        ]);
        Invitation::create(['guest_id' => $guest->id, 'status' => 'pending']);
        $results['created']++;

        $results['created'] += $this->addPlusOnes($guest, $plusOnesCount);
    }

    /**
     * Ensure a guest has at least $wanted plus-one records. Existing plus-ones
     * (and their RSVPs) are kept; only missing ones are added.
     */
    private function addPlusOnes(Guest $guest, int $wanted): int
    {
        $have = $guest->plusOnes()->count();
        for ($i = $have + 1; $i <= $wanted; $i++) {
            $po = Guest::create([
                'name' => $guest->name.' (Plus One '.$i.')',
                'group' => $guest->group,
                'parent_guest_id' => $guest->id,
                'plus_ones_allowed' => 0,
                'rsvp_status' => 'pending',
            ]);
            Invitation::create(['guest_id' => $po->id, 'status' => 'pending']);
        }

        return max(0, $wanted - $have);
    }

    /**
     * Apply a user resolution (overwrite/merge/skip) to a conflict.
     */
    private function resolveConflict(array $conflict, array &$results): void
    {
        $resolution = $conflict['resolution'] ?? 'skip';
        $existingId = $conflict['existing']['id'] ?? null;

        if (! $existingId) {
            $results['skipped']++;

            return;
        }

        $guest = Guest::find($existingId);
        if (! $guest) {
            $results['skipped']++;

            return;
        }

        $new = array_intersect_key($conflict['new'] ?? [], array_flip(self::UPDATABLE_FIELDS));
        $wantedPlusOnes = (int) ($conflict['new']['plus_ones_allowed'] ?? 0);

        if ($resolution === 'overwrite') {
            $guest->update($new);
            $results['created'] += $this->addPlusOnes($guest, $wantedPlusOnes);
            $results['updated']++;
        } elseif ($resolution === 'merge') {
            $guest->update(array_filter($new, fn ($v) => $v !== null && $v !== ''));
            $results['created'] += $this->addPlusOnes($guest, $wantedPlusOnes);
            $results['updated']++;
        } else {
            $results['skipped']++;
        }
    }
}
