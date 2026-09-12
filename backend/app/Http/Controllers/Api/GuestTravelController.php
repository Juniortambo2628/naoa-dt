<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guest;
use App\Models\GuestTravelDetail;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class GuestTravelController extends Controller
{
    use ApiResponse;

    /**
     * Get travel details for a guest (public)
     */
    public function show(string $code): JsonResponse
    {
        $guest = Guest::where('unique_code', strtoupper($code))->first();

        if (!$guest) {
            return $this->notFoundResponse('Guest not found');
        }

        $travelDetail = $guest->travelDetail;

        return $this->successResponse([
            'guest' => [
                'id' => $guest->id,
                'name' => $guest->name,
            ],
            'travel' => $travelDetail,
        ]);
    }

    /**
     * Create or update travel details (public)
     */
    public function store(Request $request, string $code): JsonResponse
    {
        $guest = Guest::where('unique_code', strtoupper($code))->first();

        if (!$guest) {
            return $this->notFoundResponse('Guest not found');
        }

        $request->validate([
            // Accommodation
            'hotel_name' => 'nullable|string|max:255',
            'hotel_address' => 'nullable|string|max:500',
            'hotel_check_in' => 'nullable|date',
            'hotel_check_out' => 'nullable|date|after_or_equal:hotel_check_in',
            'hotel_confirmation' => 'nullable|string|max:255',
            'hotel_notes' => 'nullable|string|max:1000',
            // Flight
            'airline' => 'nullable|string|max:255',
            'flight_number' => 'nullable|string|max:50',
            'flight_departure' => 'nullable|date',
            'flight_arrival' => 'nullable|date|after_or_equal:flight_departure',
            'flight_departure_airport' => 'nullable|string|max:10',
            'flight_arrival_airport' => 'nullable|string|max:10',
            'flight_confirmation' => 'nullable|string|max:255',
            'flight_notes' => 'nullable|string|max:1000',
            // Transport
            'transport_method' => 'nullable|string|in:rental-car,taxi,rideshare,public,shuttle,other',
            'transport_notes' => 'nullable|string|max:500',
        ]);

        $travelDetail = $guest->travelDetail;

        if ($travelDetail) {
            $travelDetail->update($request->only([
                'hotel_name', 'hotel_address', 'hotel_check_in', 'hotel_check_out',
                'hotel_confirmation', 'hotel_notes',
                'airline', 'flight_number', 'flight_departure', 'flight_arrival',
                'flight_departure_airport', 'flight_arrival_airport', 'flight_confirmation', 'flight_notes',
                'transport_method', 'transport_notes',
            ]));
        } else {
            $travelDetail = $guest->travelDetail()->create($request->only([
                'hotel_name', 'hotel_address', 'hotel_check_in', 'hotel_check_out',
                'hotel_confirmation', 'hotel_notes',
                'airline', 'flight_number', 'flight_departure', 'flight_arrival',
                'flight_departure_airport', 'flight_arrival_airport', 'flight_confirmation', 'flight_notes',
                'transport_method', 'transport_notes',
            ]));
        }

        return $this->successResponse($travelDetail, 'Travel details saved');
    }

    /**
     * Upload ticket file (public)
     */
    public function uploadTicket(Request $request, string $code): JsonResponse
    {
        $guest = Guest::where('unique_code', strtoupper($code))->first();

        if (!$guest) {
            return $this->notFoundResponse('Guest not found');
        }

        $request->validate([
            'ticket' => 'required|file|max:10240|mimes:pdf,jpg,jpeg,png',
        ]);

        $travelDetail = $guest->travelDetail;

        if (!$travelDetail) {
            $travelDetail = $guest->travelDetail()->create([]);
        }

        // Delete old ticket if exists
        if ($travelDetail->ticket_file_path && Storage::disk('public')->exists($travelDetail->ticket_file_path)) {
            Storage::disk('public')->delete($travelDetail->ticket_file_path);
        }

        // Store new ticket
        $file = $request->file('ticket');
        $path = $file->store('travel-tickets/' . $guest->id, 'public');

        $travelDetail->update([
            'ticket_file_path' => $path,
            'ticket_file_name' => $file->getClientOriginalName(),
            'ticket_file_type' => $file->getClientOriginalExtension(),
        ]);

        return $this->successResponse([
            'ticket_file_path' => $travelDetail->ticket_file_path,
            'ticket_file_name' => $travelDetail->ticket_file_name,
            'ticket_file_type' => $travelDetail->ticket_file_type,
        ], 'Ticket uploaded successfully');
    }

    /**
     * Delete ticket file (public)
     */
    public function deleteTicket(string $code): JsonResponse
    {
        $guest = Guest::where('unique_code', strtoupper($code))->first();

        if (!$guest) {
            return $this->notFoundResponse('Guest not found');
        }

        $travelDetail = $guest->travelDetail;

        if (!$travelDetail || !$travelDetail->ticket_file_path) {
            return $this->errorResponse('No ticket to delete', 404);
        }

        // Delete file
        if (Storage::disk('public')->exists($travelDetail->ticket_file_path)) {
            Storage::disk('public')->delete($travelDetail->ticket_file_path);
        }

        $travelDetail->update([
            'ticket_file_path' => null,
            'ticket_file_name' => null,
            'ticket_file_type' => null,
        ]);

        return $this->successResponse(null, 'Ticket deleted');
    }
}
