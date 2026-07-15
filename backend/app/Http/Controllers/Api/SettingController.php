<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Traits\ApiResponse;
use App\Traits\NormalizesUrls;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    use ApiResponse, NormalizesUrls;
    public function index()
    {
        \Illuminate\Support\Facades\Log::info("Fetching settings. Current root: " . request()->root());
        // Return key-value pairs for easy frontend consumption
        $settings = Setting::all()->pluck('value', 'key')->map(function ($value) {
            $decoded = json_decode($value, true);
            $val = (json_last_error() === JSON_ERROR_NONE && (is_array($decoded) || is_object($decoded))) ? $decoded : $value;
            return $this->normalizeUrls($val);
        });
        return $this->successResponse($settings);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'nullable', // Allow strings, arrays, etc.
        ]);

        \Illuminate\Support\Facades\Log::info("Updating settings", ['data' => $data['settings']]);

        foreach ($data['settings'] as $key => $value) {
            // Convert arrays to JSON strings
            $storedValue = is_array($value) ? json_encode($value) : $value;

            $setting = Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $storedValue]
            );
            
            \Illuminate\Support\Facades\Log::info("Saved setting: {$key}", ['value' => $storedValue, 'id' => $setting->id]);
        }

        // Refresh all settings to ensure frontend is in sync
        $allSettings = Setting::all()->pluck('value', 'key')->map(function ($value) {
            $decoded = json_decode($value, true);
            $val = (json_last_error() === JSON_ERROR_NONE && (is_array($decoded) || is_object($decoded))) ? $decoded : $value;
            return $this->normalizeUrls($val);
        });

        return $this->successResponse($allSettings, 'Settings updated successfully');
    }
}
