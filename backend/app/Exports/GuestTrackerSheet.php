<?php

namespace App\Exports;

use App\Models\Guest;
use App\Support\InviteMessage;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DefaultValueBinder;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class GuestTrackerSheet extends DefaultValueBinder implements FromCollection, WithColumnWidths, WithCustomValueBinder, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(
        protected string $title,
        protected Collection $guests,
        protected InviteMessage $builder,
    ) {}

    public function collection(): Collection
    {
        return $this->guests;
    }

    public function title(): string
    {
        return $this->title;
    }

    public function headings(): array
    {
        return [
            'Name',
            'Phone',
            'Email',
            'Group',
            'Invitation Code',
            'Invite Status',
            'Invited On',
            'Send Via',
            'RSVP Status',
            'Invitation Link',
            'WhatsApp Message',
            'WhatsApp Link (opens chat with message)',
        ];
    }

    /**
     * @param  Guest  $guest
     */
    public function map($guest): array
    {
        return [
            $guest->name,
            $guest->phone ?? '',
            $guest->email ?? '',
            $guest->group ?? '',
            $guest->unique_code,
            GuestTrackerExport::isInvited($guest) ? 'Invited' : 'Not yet invited',
            $guest->invitation?->sent_at?->format('Y-m-d H:i') ?? '',
            $guest->invitation_via ?? '',
            $guest->rsvp_status,
            $this->builder->invitationUrl($guest),
            $this->builder->whatsappText($guest),
            $this->builder->whatsappLink($guest) ?? '',
        ];
    }

    /** Keep every cell as text so "+254…" phones and codes are never turned into numbers. */
    public function bindValue(Cell $cell, $value): bool
    {
        $cell->setValueExplicit((string) $value, DataType::TYPE_STRING);

        return true;
    }

    public function columnWidths(): array
    {
        return ['A' => 28, 'B' => 18, 'C' => 28, 'D' => 14, 'E' => 16, 'F' => 16, 'G' => 17, 'H' => 10, 'I' => 12, 'J' => 40, 'K' => 60, 'L' => 40];
    }

    public function styles(Worksheet $sheet): array
    {
        $sheet->freezePane('B2');

        return [
            1 => ['font' => ['bold' => true]],
            'K' => ['alignment' => ['wrapText' => true, 'vertical' => 'top']],
        ];
    }
}
