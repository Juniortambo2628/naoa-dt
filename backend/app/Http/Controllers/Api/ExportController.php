<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guest;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\GuestsExport;
use Barryvdh\DomPDF\Facade\Pdf;

class ExportController extends Controller
{
    /**
     * Export guests to Excel
     */
    public function exportGuestsExcel()
    {
        return Excel::download(new GuestsExport, 'guest-list.xlsx');
    }

    /**
     * Export vendor summary PDF (for catering/security)
     */
    public function exportVendorPdf()
    {
        $guests = Guest::where('rsvp_status', 'confirmed')->get();
        
        $data = [
            'title' => 'Wedding Guest Summary - Vendor Copy',
            'date' => now()->format('F j, Y'),
            'totalConfirmed' => $guests->count(),
            'totalAttendees' => $guests->count(), // Headcount is simply the count of confirmed individual records
            'dietaryBreakdown' => $guests->whereNotNull('dietary_notes')
                ->groupBy('dietary_notes')
                ->map(fn($g) => $g->count())
                ->toArray(),
            'guests' => $guests->map(fn($g) => [
                'name' => $g->name,
                'dietary' => $g->dietary_notes ?: 'None',
                'table' => $g->table?->name ?: 'Unassigned',
                'is_plus_one' => $g->parent_guest_id !== null,
            ])->toArray()
        ];

        $pdf = Pdf::loadView('exports.vendor-summary', $data);
        return $pdf->download('vendor-summary.pdf');
    }
}
