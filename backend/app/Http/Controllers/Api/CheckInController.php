<?php

namespace App\Http\Controllers\Api;

use App\Events\GuestCheckedIn;
use App\Http\Controllers\Controller;
use App\Models\Guest;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class CheckInController extends Controller
{
    use ApiResponse;

    public function generateQR(Guest $guest): JsonResponse
    {
        if (! $guest->qr_code) {
            $guest->qr_code = 'QR-'.strtoupper(Str::random(10));
            $guest->save();
        }

        $qrCode = QrCode::format('png')
            ->size(300)
            ->margin(2)
            ->generate($guest->qr_code);

        return $this->successResponse([
            'qr_code' => $guest->qr_code,
            'qr_image' => 'data:image/png;base64,'.base64_encode($qrCode),
            'guest' => $guest,
        ]);
    }

    /**
     * Check a guest in from a scan. The QR on the guest's card and digital
     * invite holds their invitation link (…/invitation/CODE), so the scanner
     * accepts that link, the bare invite code, or an older generated QR code.
     */
    public function checkIn(Request $request): JsonResponse
    {
        $request->validate([
            'qr_code' => 'required|string|max:500',
        ]);

        $guest = $this->findScannedGuest($request->input('qr_code'));

        if (! $guest) {
            return $this->notFoundResponse('This code doesn\'t match any guest. Search for them by name instead.');
        }

        return $this->markArrived($guest);
    }

    /** Check a guest in by hand (found by name at the door). */
    public function checkInGuest(Guest $guest): JsonResponse
    {
        return $this->markArrived($guest);
    }

    /** Undo a check-in made by mistake. */
    public function undoCheckIn(Guest $guest): JsonResponse
    {
        $guest->checked_in_at = null;
        $guest->save();

        return $this->successResponse(['guest' => $this->summary($guest)], $guest->name.' is no longer checked in.');
    }

    private function findScannedGuest(string $scanned): ?Guest
    {
        $value = trim($scanned);

        // An invitation link: take the code after /invitation/.
        if (preg_match('~/invitation/([A-Za-z0-9]+)~', $value, $m)) {
            $value = $m[1];
        }

        return Guest::with('table')
            ->where('unique_code', strtoupper($value))
            ->orWhere('qr_code', $value)
            ->first();
    }

    private function markArrived(Guest $guest): JsonResponse
    {
        $guest->loadMissing('table');

        if ($guest->checked_in_at) {
            return $this->errorResponse(
                $guest->name.' was already checked in at '.$guest->checked_in_at->format('g:i A').'.',
                400,
                ['guest' => $this->summary($guest)]
            );
        }

        $guest->checked_in_at = now();
        $guest->save();

        event(new GuestCheckedIn($guest));

        return $this->successResponse(
            ['guest' => $this->summary($guest)],
            'Welcome, '.$guest->name.'!'
        );
    }

    /** What the usher needs to see: who, where they sit, and anything to watch for. */
    private function summary(Guest $guest): array
    {
        $guest->loadMissing('table', 'parentGuest:id,name');

        return [
            'id' => $guest->id,
            'name' => $guest->name,
            'group' => $guest->group,
            'table' => $guest->table ? ['id' => $guest->table->id, 'name' => $guest->table->name] : null,
            'rsvp_status' => $guest->rsvp_status,
            'dietary_notes' => $guest->dietary_notes,
            'guest_of' => $guest->parentGuest?->name,
            'checked_in_at' => $guest->checked_in_at,
        ];
    }

    public function getStats(): JsonResponse
    {
        $total = Guest::confirmed()->count();
        $checkedIn = Guest::checkedIn()->count();

        return $this->successResponse([
            'total_expected' => $total,
            'checked_in' => $checkedIn,
            'remaining' => $total - $checkedIn,
            'percentage' => $total > 0 ? round(($checkedIn / $total) * 100) : 0,
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
