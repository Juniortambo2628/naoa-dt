<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FlightService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class FlightController extends Controller
{
    use ApiResponse;

    public function __construct(
        private FlightService $flightService
    ) {}

    /**
     * Look up flight details by flight number
     */
    public function lookup(Request $request)
    {
        $request->validate([
            'flight_number' => 'required|string|max:10',
            'date' => 'nullable|date_format:Y-m-d',
        ]);

        $flightNumber = strtoupper(str_replace(' ', '', $request->flight_number));
        $date = $request->date ?? now()->format('Y-m-d');

        $flightData = $this->flightService->lookupFlight($flightNumber, $date);

        if (!$flightData) {
            return $this->notFoundResponse('Flight not found. Please check the flight number and try again.');
        }

        $eta = $this->flightService->calculateETA($flightData);

        return $this->successResponse([
            'flight' => $flightData,
            'eta' => $eta,
        ]);
    }

    /**
     * Get live flight status (for periodic refresh)
     */
    public function status(Request $request)
    {
        $request->validate([
            'flight_number' => 'required|string|max:10',
            'date' => 'nullable|date_format:Y-m-d',
        ]);

        $flightNumber = strtoupper(str_replace(' ', '', $request->flight_number));
        $date = $request->date ?? now()->format('Y-m-d');

        $flightData = $this->flightService->getFlightStatus($flightNumber, $date);

        if (!$flightData) {
            return $this->notFoundResponse('Unable to fetch flight status.');
        }

        $eta = $this->flightService->calculateETA($flightData);

        return $this->successResponse([
            'flight' => $flightData,
            'eta' => $eta,
        ]);
    }
}
