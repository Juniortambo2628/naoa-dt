<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guest;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Str;

class CheckInController extends Controller
{
    /**
     * Generate QR code for a guest
     */
    public function generateQR(Guest $guest)
    {
        // Generate unique QR code if not exists
        if (!$guest->qr_code) {
            $guest->qr_code = 'QR-' . strtoupper(Str::random(10));
            $guest->save();
        }

        // Generate QR code image as base64
        $qrCode = QrCode::format('png')
            ->size(300)
            ->margin(2)
            ->generate($guest->qr_code);

        return response()->json([
            'qr_code' => $guest->qr_code,
            'qr_image' => 'data:image/png;base64,' . base64_encode($qrCode),
            'guest' => $guest
        ]);
    }

    /**
     * Check in a guest by QR code
     */
    public function checkIn(Request $request)
    {
        $request->validate([
            'qr_code' => 'required|string'
        ]);

        $guest = Guest::where('qr_code', $request->qr_code)->first();

        if (!$guest) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid QR code. Guest not found.'
            ], 404);
        }

        if ($guest->checked_in_at) {
            return response()->json([
                'success' => false,
                'message' => 'Guest already checked in at ' . $guest->checked_in_at->format('g:i A'),
                'guest' => $guest
            ], 400);
        }

        $guest->checked_in_at = now();
        $guest->save();

        return response()->json([
            'success' => true,
            'message' => 'Welcome, ' . $guest->name . '!',
            'guest' => $guest->load('table')
        ]);
    }

    /**
     * Get check-in stats
     */
    public function getStats()
    {
        // Count guests who have RSVP'd as attending
        $total = Guest::whereHas('rsvpResponse', function ($query) {
            $query->where('attending', true);
        })->count();
        
        $checkedIn = Guest::whereNotNull('checked_in_at')->count();

        return response()->json([
            'total_expected' => $total,
            'checked_in' => $checkedIn,
            'remaining' => $total - $checkedIn,
            'percentage' => $total > 0 ? round(($checkedIn / $total) * 100) : 0
        ]);
    }
}
