<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class WeatherController extends Controller
{
    use ApiResponse;

    public function forecast(): JsonResponse
    {
        $lat = Setting::getValue('venue_lat', '-1.2921');
        $lng = Setting::getValue('venue_lng', '36.8219');

        $response = Http::withoutVerifying()->timeout(10)->get('https://api.open-meteo.com/v1/forecast', [
            'latitude' => $lat,
            'longitude' => $lng,
            'daily' => 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode',
            'timezone' => 'auto',
            'forecast_days' => 7,
        ]);

        if ($response->failed()) {
            return $this->errorResponse('Weather service unavailable', 503);
        }

        return $this->successResponse($response->json());
    }
}
