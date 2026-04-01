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
            'Plus Ones',
            'Dietary Preference',
            'Table',
            'Checked In',
            'Song Request',
            'Notes',
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
            $guest->plus_ones,
            $guest->dietary_preference,
            $guest->table?->name ?? 'Unassigned',
            $guest->checked_in_at ? 'Yes' : 'No',
            $guest->song_request ?? '',
            $guest->notes ?? '',
        ];
    }
}
