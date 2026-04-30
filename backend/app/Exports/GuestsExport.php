<?php

namespace App\Exports;

use App\Models\Guest;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class GuestsExport implements FromCollection, WithHeadings, WithMapping
{
    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return Guest::with('table')->get();
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'ID',
            'Name',
            'Email',
            'Phone',
            'Group',
            'RSVP Status',
            'Is Plus One',
            'Primary Guest',
            'Dietary Notes',
            'RSVP Message',
            'Table',
            'Checked In',
            'Song Request',
            'Admin Notes',
        ];
    }

    /**
     * @param \App\Models\Guest $guest
     * @return array
     */
    public function map($guest): array
    {
        return [
            $guest->id,
            $guest->name,
            $guest->email,
            $guest->phone,
            $guest->group,
            $guest->rsvp_status,
            $guest->parent_guest_id ? 'Yes' : 'No',
            $guest->parentGuest?->name ?? 'N/A',
            $guest->dietary_notes,
            $guest->rsvp_message,
            $guest->table?->name ?? 'Unassigned',
            $guest->checked_in_at ? 'Yes' : 'No',
            $guest->song_request ?? '',
            $guest->notes ?? '',
        ];
    }
}
