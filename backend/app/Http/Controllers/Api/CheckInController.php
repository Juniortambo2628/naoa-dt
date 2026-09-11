<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guest;
use App\Events\GuestCheckedIn;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Str;

class CheckInController extends Controller
{
    use ApiResponse;

    public function generateQR(Guest $guest): JsonResponse
    {
        if (!$guest->qr_code) {
            $guest->qr_code = 'QR-' . strtoupper(Str::random(10));
            $guest->save();
        }

        $qrCode = QrCode::format('png')
            ->size(300)
            ->margin(2)
            ->generate($guest->qr_code);

        return $this->successResponse([
            'qr_code'  => $guest->qr_code,
            'qr_image' => 'data:image/png;base64,' . base64_encode($qrCode),
            'guest'    => $guest,
        ]);
    }

    public function checkIn(Request $request): JsonResponse
    {
        $request->validate([
            'qr_code' => 'required|string',
        ]);

        $guest = Guest::with('table')->where('qr_code', $request->qr_code)->first();

        if (!$guest) {
            return $this->notFoundResponse('Invalid QR code. Guest not found.');
        }

        if ($guest->checked_in_at) {
            return $this->errorResponse(
                'Guest already checked in at ' . $guest->checked_in_at->format('g:i A'),
                400,
                ['guest' => $guest]
            );
        }

        $guest->checked_in_at = now();
        $guest->save();

        // Load table relationship for broadcasting
        $guest->load('table');

        // Broadcast the check-in event
        event(new GuestCheckedIn($guest));

        return $this->successResponse(
            ['guest' => $guest],
            'Welcome, ' . $guest->name . '!'
        );
    }

    public function getStats(): JsonResponse
    {
        $total = Guest::confirmed()->count();
        $checkedIn = Guest::checkedIn()->count();

        return $this->successResponse([
            'total_expected' => $total,
            'checked_in'     => $checkedIn,
            'remaining'      => $total - $checkedIn,
            'percentage'     => $total > 0 ? round(($checkedIn / $total) * 100) : 0,
        ]);
    }

    public function getCheckedInGuests(): JsonResponse
    {
        $guests = Guest::checkedIn()
            ->with('table:id,name')
            ->orderBy('checked_in_at', 'desc')
            ->get()
            ->map(function ($guest) {
                return [
                    'id' => $guest->id,
                    'name' => $guest->name,
                    'group' => $guest->group,
                    'table_id' => $guest->table_id,
                    'table_name' => $guest->table?->name,
                    'checked_in_at' => $guest->checked_in_at,
                ];
            });

        return $this->successResponse($guests);
    }
}
