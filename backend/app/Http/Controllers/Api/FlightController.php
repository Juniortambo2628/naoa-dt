<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FlightService;
use Illuminate\Http\Request;

class FlightController extends Controller
{
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
            return response()->json([
                'success' => false,
                'message' => 'Flight not found. Please check the flight number and try again.',
            ], 404);
        }

        $eta = $this->flightService->calculateETA($flightData);

        return response()->json([
            'success' => true,
            'data' => [
                'flight' => $flightData,
                'eta' => $eta,
            ],
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
            return response()->json([
                'success' => false,
                'message' => 'Unable to fetch flight status.',
            ], 404);
        }

        $eta = $this->flightService->calculateETA($flightData);

        return response()->json([
            'success' => true,
            'data' => [
                'flight' => $flightData,
                'eta' => $eta,
            ],
        ]);
    }

    /**
     * Search flights (autocomplete)
     */
    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:2|max:10',
        ]);

        $results = $this->flightService->searchFlights($request->query);

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }
}
