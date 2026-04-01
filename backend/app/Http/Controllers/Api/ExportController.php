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
            'totalAttendees' => $guests->count() + $guests->sum('plus_ones'),
            'dietaryBreakdown' => $guests->groupBy('dietary_preference')
                ->map(fn($g) => $g->count())
                ->toArray(),
            'guests' => $guests->map(fn($g) => [
                'name' => $g->name,
                'plus_ones' => $g->plus_ones,
                'dietary' => $g->dietary_preference ?: 'Standard',
                'table' => $g->table?->name ?: 'Unassigned',
            ])->toArray()
        ];

        $pdf = Pdf::loadView('exports.vendor-summary', $data);
        return $pdf->download('vendor-summary.pdf');
    }
}
