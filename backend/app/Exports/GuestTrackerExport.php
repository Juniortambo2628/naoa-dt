<?php

namespace App\Exports;

use App\Models\Guest;
use App\Support\InviteMessage;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * Invitation tracker: every primary guest with their invitation code, whether
 * they have been invited yet, and a ready-to-send WhatsApp message and link.
 * Split into All / Remaining / Invited sheets so invites can be shared out.
 */
class GuestTrackerExport implements WithMultipleSheets
{
    public function __construct(
        protected ?string $baseUrl = null,
        protected ?string $group = null,
    ) {}

    public function sheets(): array
    {
        $guests = Guest::query()
            ->whereNull('parent_guest_id') // plus-ones are invited through their primary guest
            ->when($this->group, fn ($q) => $q->where('group', $this->group))
            ->with('invitation')
            ->orderBy('name')
            ->get();

        $builder = new InviteMessage($this->baseUrl);
        [$invited, $remaining] = $guests->partition(fn (Guest $g) => self::isInvited($g));

        return [
            new GuestTrackerSheet('All Guests', $guests, $builder),
            new GuestTrackerSheet('Remaining', $remaining->values(), $builder),
            new GuestTrackerSheet('Invited', $invited->values(), $builder),
        ];
    }

    public static function isInvited(Guest $guest): bool
    {
        $invitation = $guest->invitation;

        return ($invitation && ($invitation->sent_at || in_array($invitation->status, ['sent', 'opened', 'responded'], true)))
            || $guest->rsvp_status !== 'pending';
    }
}
