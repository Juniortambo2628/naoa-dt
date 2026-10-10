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
        $rows = $data[0] ?? [];

        $conflicts = [];
        $valid = [];
        $skippedCount = 0;
        $seen = []; // rows already handled in this file, to drop in-file duplicates

        foreach ($rows as $row) {
            if (empty($row['names']) && empty($row['name'])) {
                $skippedCount++;

                continue;
            }

            $name = trim($row['names'] ?? $row['name'] ?? '');
            $email = ! empty($row['email']) ? trim($row['email']) : null;
            $phone = ! empty($row['telphone_number']) ? trim($row['telphone_number']) : null;
            $method = ! empty($row['save_the_date_sent_via_whatsappemail']) ? trim($row['save_the_date_sent_via_whatsappemail']) : null;
            $invitation_via = ! empty($row['invitation_via']) ? trim($row['invitation_via']) : null;
            $group = ! empty($row['group']) ? trim($row['group']) : 'Invited';
            $plusOnes = max(0, ((int) ($row['number_of_invites'] ?? 1)) - 1);

            $keys = $this->rowKeys($name, $email, $phone);
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
     * Find an existing guest by email, then phone, then name — all compared
     * case/whitespace-insensitively (phones by digits only). Plus-one records
     * are ignored so "Jane (Plus One 1)" never matches a primary row.
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

        $digits = $this->phoneDigits($phone);
        if (strlen($digits) >= 7) {
            $existing = $primary()->whereNotNull('phone')->get(['id', 'phone'])
                ->first(fn ($g) => $this->phoneDigits($g->phone) === $digits);
            if ($existing) {
                return Guest::find($existing->id);
            }
        }

        $normalized = $this->normalizeName($name);

        return $primary()->get()->first(fn ($g) => $this->normalizeName($g->name) === $normalized);
    }

    private function normalizeName(?string $name): string
    {
        return mb_strtolower(preg_replace('/\s+/', ' ', trim((string) $name)));
    }

    private function phoneDigits(?string $phone): string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone);

        // Treat 07xx… and 2547xx… (Kenya) as the same number.
        if (str_starts_with($digits, '0') && strlen($digits) === 10) {
            $digits = '254'.substr($digits, 1);
        }

        return $digits;
    }

    /** Identity keys for in-file duplicate detection. */
    private function rowKeys(string $name, ?string $email, ?string $phone): array
    {
        $keys = ['name:'.$this->normalizeName($name)];
        if ($email) {
            $keys[] = 'email:'.mb_strtolower(trim($email));
        }
        $digits = $this->phoneDigits($phone);
        if (strlen($digits) >= 7) {
            $keys[] = 'phone:'.$digits;
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
