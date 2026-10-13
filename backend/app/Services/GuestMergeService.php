<?php

namespace App\Services;

use App\Models\GiftClaim;
use App\Models\Guest;
use App\Models\GuestTravelDetail;
use App\Models\Invitation;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Finds guest records that look like the same person and merges them, so a
 * guest is never invited twice and the RSVP statistics count each person once.
 */
class GuestMergeService
{
    /** Titles stripped before comparing names ("Mr. John Doe" == "John Doe"). */
    private const HONORIFICS = ['mr', 'mrs', 'ms', 'miss', 'mx', 'dr', 'prof', 'rev', 'sir', 'madam', 'hon'];

    /** Fields copied from a duplicate when the kept record has no value. */
    private const FILLABLE_WHEN_EMPTY = [
        'email', 'phone', 'group', 'table_id', 'song_request', 'qr_code', 'checked_in_at',
        'save_the_date_method', 'invitation_via',
        'location_zone', 'location_lat', 'location_lng', 'location_updated_at',
    ];

    /** Invitation statuses ordered by how far the invite has progressed. */
    private const INVITATION_RANK = ['pending' => 0, 'sent' => 1, 'opened' => 2, 'responded' => 3];

    /**
     * Group guests that share an email address or a normalised name.
     *
     * @return array<int, array{reasons: string[], guests: Collection}>
     */
    public function findDuplicateGroups(): array
    {
        $guests = Guest::with(['invitation', 'parentGuest'])->orderBy('id')->get();

        // Union-find over guest ids so A~B (email) and B~C (name) form one group.
        $parent = [];
        $find = function (int $id) use (&$parent, &$find): int {
            if ($parent[$id] !== $id) {
                $parent[$id] = $find($parent[$id]);
            }

            return $parent[$id];
        };
        $reasons = [];

        $buckets = [];
        foreach ($guests as $guest) {
            $parent[$guest->id] = $guest->id;

            if ($email = $this->normalizeEmail($guest->email)) {
                $buckets['email:'.$email][] = $guest->id;
            }
            if ($name = $this->nameKey($guest->name)) {
                $buckets['name:'.$name][] = $guest->id;
            }
        }

        foreach ($buckets as $key => $ids) {
            if (count($ids) < 2) {
                continue;
            }
            $reason = str_starts_with($key, 'email:') ? 'Same email' : 'Same name';
            foreach (array_slice($ids, 1) as $id) {
                $a = $find($ids[0]);
                $b = $find($id);
                if ($a !== $b) {
                    $parent[$b] = $a;
                }
            }
            foreach ($ids as $id) {
                $reasons[$id][$reason] = true;
            }
        }

        $groups = [];
        foreach ($guests as $guest) {
            $groups[$find($guest->id)][] = $guest;
        }

        return collect($groups)
            ->filter(fn ($members) => count($members) > 1)
            ->map(fn ($members) => [
                'reasons' => collect($members)
                    ->flatMap(fn ($g) => array_keys($reasons[$g->id] ?? []))
                    ->unique()->values()->all(),
                'guests' => collect($members),
            ])
            ->values()
            ->all();
    }

    /**
     * Merge each duplicate into the kept guest and soft-delete the duplicates.
     *
     * @param  int[]  $duplicateIds
     */
    public function merge(Guest $keep, array $duplicateIds): Guest
    {
        $duplicateIds = array_values(array_diff(array_unique(array_map('intval', $duplicateIds)), [$keep->id]));
        if (empty($duplicateIds)) {
            throw new InvalidArgumentException('Select at least one duplicate to merge.');
        }

        return DB::transaction(function () use ($keep, $duplicateIds) {
            $duplicates = Guest::with(['invitation', 'travelDetail'])
                ->whereIn('id', $duplicateIds)
                ->get();

            if ($duplicates->count() !== count($duplicateIds)) {
                throw new InvalidArgumentException('One or more guests to merge no longer exist.');
            }

            foreach ($duplicates as $duplicate) {
                $this->mergeOne($keep, $duplicate);
            }

            return $keep->fresh(['invitation', 'parentGuest', 'plusOnes.invitation']);
        });
    }

    private function mergeOne(Guest $keep, Guest $duplicate): void
    {
        $updates = [];

        foreach (self::FILLABLE_WHEN_EMPTY as $field) {
            if ($this->isBlank($keep->{$field}) && ! $this->isBlank($duplicate->{$field})) {
                $updates[$field] = $duplicate->{$field};
            }
        }

        // Keep the most informative RSVP: a recorded answer beats "pending".
        if ($keep->rsvp_status === 'pending' && $duplicate->rsvp_status !== 'pending') {
            $updates['rsvp_status'] = $duplicate->rsvp_status;
            $updates['rsvp_message'] = $duplicate->rsvp_message;
            $updates['dietary_notes'] = $duplicate->dietary_notes;
        } else {
            foreach (['rsvp_message', 'dietary_notes'] as $field) {
                if ($this->isBlank($keep->{$field}) && ! $this->isBlank($duplicate->{$field})) {
                    $updates[$field] = $duplicate->{$field};
                }
            }
        }

        $updates['plus_ones_allowed'] = max((int) $keep->plus_ones_allowed, (int) $duplicate->plus_ones_allowed);

        // A primary guest merged into one of their own plus-ones would leave
        // the plus-one pointing at a deleted parent; promote it instead.
        if ($keep->parent_guest_id === $duplicate->id) {
            $updates['parent_guest_id'] = $duplicate->parent_guest_id;
        }

        // Free the duplicate's unique email before the kept record takes it
        // (soft-deleted rows still hold the unique index).
        if ($duplicate->email !== null) {
            $duplicate->forceFill(['email' => null])->saveQuietly();
        }

        $keep->fill($updates)->save();

        // Re-home the duplicate's plus-ones (except the kept guest itself).
        Guest::where('parent_guest_id', $duplicate->id)
            ->where('id', '!=', $keep->id)
            ->update(['parent_guest_id' => $keep->id]);

        GiftClaim::where('guest_id', $duplicate->id)->update(['guest_id' => $keep->id]);

        $this->mergeInvitation($keep, $duplicate);
        $this->mergeTravelDetail($keep, $duplicate);

        $duplicate->delete();
    }

    /** Keep whichever invitation has progressed furthest (invitations are 1:1). */
    private function mergeInvitation(Guest $keep, Guest $duplicate): void
    {
        $theirs = $duplicate->invitation;
        if (! $theirs) {
            return;
        }

        // Invitations soft-delete, and trashed rows still hold the unique
        // guest_id index, so the losing invitation is removed for good.
        $ours = Invitation::where('guest_id', $keep->id)->first();
        if ($ours && $this->invitationRank($ours) >= $this->invitationRank($theirs)) {
            $theirs->forceDelete();

            return;
        }

        Invitation::withTrashed()->where('guest_id', $keep->id)->forceDelete();
        $theirs->update(['guest_id' => $keep->id]);
    }

    private function mergeTravelDetail(Guest $keep, Guest $duplicate): void
    {
        $theirs = $duplicate->travelDetail;
        if (! $theirs) {
            return;
        }

        if (GuestTravelDetail::where('guest_id', $keep->id)->exists()) {
            $theirs->delete();
        } else {
            $theirs->update(['guest_id' => $keep->id]);
        }
    }

    private function invitationRank(Invitation $invitation): int
    {
        return self::INVITATION_RANK[$invitation->status] ?? 0;
    }

    private function isBlank(mixed $value): bool
    {
        return $value === null || (is_string($value) && trim($value) === '');
    }

    private function normalizeEmail(?string $email): ?string
    {
        $email = mb_strtolower(trim((string) $email));

        return $email === '' ? null : $email;
    }

    /**
     * Order-insensitive name key: "Doe, John" == "john  doe" == "Mr. John Doe".
     * Placeholder plus-one names ("Jane (Plus One 1)") are never matched.
     */
    public function nameKey(?string $name): ?string
    {
        $name = mb_strtolower(trim((string) $name));
        if ($name === '' || preg_match('/plus[\s-]*one|guest of/u', $name)) {
            return null;
        }

        $tokens = preg_split('/[^\p{L}\p{N}]+/u', $name, -1, PREG_SPLIT_NO_EMPTY);
        $tokens = array_values(array_diff($tokens, self::HONORIFICS));
        if (empty($tokens)) {
            return null;
        }
        sort($tokens);

        return implode(' ', $tokens);
    }
}
