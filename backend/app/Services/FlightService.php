<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class FlightService
{
    private string $apiKey;
    private string $baseUrl = 'http://api.aviationstack.com/v1';

    public function __construct()
    {
        $this->apiKey = config('services.aviationstack.key', '');
    }

    /**
     * Look up flight details by flight number and date
     */
    public function lookupFlight(string $flightNumber, ?string $date = null): ?array
    {
        if (empty($this->apiKey)) {
            Log::warning('AviationStack API key not configured');
            return null;
        }

        // Normalize flight number (remove spaces, uppercase)
        $flightNumber = strtoupper(str_replace(' ', '', $flightNumber));
        
        // Cache for 1 hour to save API calls
        $cacheKey = "flight_{$flightNumber}_{$date}";
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return $cached;
        }

        try {
            $params = [
                'access_key' => $this->apiKey,
                'flight_iata' => $flightNumber,
            ];
            
            if ($date) {
                $params['flight_date'] = $date;
            }

            $response = Http::timeout(10)
                ->get("{$this->baseUrl}/flights", $params);

            if ($response->failed()) {
                Log::error('AviationStack API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return null;
            }

            $data = $response->json();
            
            if (empty($data['data']) || count($data['data']) === 0) {
                return null;
            }

            $flight = $data['data'][0];
            
            $result = [
                'flight_number' => $flight['flight']['iata'] ?? $flightNumber,
                'airline' => $flight['airline']['name'] ?? null,
                'airline_iata' => $flight['airline']['iata'] ?? null,
                'departure_airport' => $flight['departure']['airport'] ?? null,
                'departure_iata' => $flight['departure']['iata'] ?? null,
                'departure_terminal' => $flight['departure']['terminal'] ?? null,
                'departure_gate' => $flight['departure']['gate'] ?? null,
                'departure_scheduled' => $flight['departure']['scheduled'] ?? null,
                'departure_actual' => $flight['departure']['actual'] ?? null,
                'departure_estimated' => $flight['departure']['estimated'] ?? null,
                'arrival_airport' => $flight['arrival']['airport'] ?? null,
                'arrival_iata' => $flight['arrival']['iata'] ?? null,
                'arrival_terminal' => $flight['arrival']['terminal'] ?? null,
                'arrival_gate' => $flight['arrival']['gate'] ?? null,
                'arrival_scheduled' => $flight['arrival']['scheduled'] ?? null,
                'arrival_actual' => $flight['arrival']['actual'] ?? null,
                'arrival_estimated' => $flight['arrival']['estimated'] ?? null,
                'status' => $flight['flight_status'] ?? null,
                'delay_departure' => $flight['departure']['delay'] ?? null,
                'delay_arrival' => $flight['arrival']['delay'] ?? null,
                'codeshare' => $flight['flight']['codeshared'] ?? null,
            ];

            // Cache for 1 hour
            Cache::put($cacheKey, $result, now()->addHour());
            
            return $result;

        } catch (\Exception $e) {
            Log::error('Flight lookup failed', [
                'flight' => $flightNumber,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get live flight status
     */
    public function getFlightStatus(string $flightNumber, ?string $date = null): ?array
    {
        return $this->lookupFlight($flightNumber, $date);
    }

    /**
     * Search flights by route (for autocomplete)
     */
    public function searchFlights(string $query): array
    {
        if (empty($this->apiKey)) {
            return [];
        }

        try {
            $response = Http::timeout(10)
                ->get("{$this->baseUrl}/flights", [
                    'access_key' => $this->apiKey,
                    'flight_iata' => $query,
                    'limit' => 5,
                ]);

            if ($response->failed()) {
                return [];
            }

            $data = $response->json();
            
            return collect($data['data'] ?? [])->map(function ($flight) {
                return [
                    'flight_number' => $flight['flight']['iata'] ?? null,
                    'airline' => $flight['airline']['name'] ?? null,
                    'departure' => $flight['departure']['iata'] ?? null,
                    'arrival' => $flight['arrival']['iata'] ?? null,
                    'status' => $flight['flight_status'] ?? null,
                ];
            })->toArray();

        } catch (\Exception $e) {
            Log::error('Flight search failed', ['query' => $query, 'error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Calculate ETA based on flight data
     */
    public function calculateETA(array $flightData): ?array
    {
        $arrivalTime = $flightData['arrival_estimated'] 
            ?? $flightData['arrival_scheduled'] 
            ?? null;

        if (!$arrivalTime) {
            return null;
        }

        $arrival = new \DateTime($arrivalTime);
        $now = new \DateTime();
        $diff = $now->diff($arrival);
        
        $isPast = ($arrival < $now);
        $hours = $diff->h + ($diff->days * 24);
        $minutes = $diff->i;

        return [
            'arrival_time' => $arrival->format('H:i M d, Y'),
            'hours_until' => $hours,
            'minutes_until' => $minutes,
            'is_past' => $isPast,
            'is_landed' => in_array($flightData['status'], ['landed', 'cancelled']),
            'delay_minutes' => $flightData['delay_arrival'] ?? 0,
            'original_arrival' => $flightData['arrival_scheduled'] 
                ? (new \DateTime($flightData['arrival_scheduled']))->format('H:i')
                : null,
        ];
    }
}
