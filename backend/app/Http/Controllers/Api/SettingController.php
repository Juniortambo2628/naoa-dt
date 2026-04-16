<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

use App\Models\PageContent;

class SettingController extends Controller
{
    public function index()
    {
        \Illuminate\Support\Facades\Log::info("Fetching settings. Current root: " . request()->root());
        // Return key-value pairs for easy frontend consumption
        $settings = Setting::all()->pluck('value', 'key')->map(function ($value) {
            $decoded = json_decode($value, true);
            $val = (json_last_error() === JSON_ERROR_NONE && (is_array($decoded) || is_object($decoded))) ? $decoded : $value;
            return $this->normalizeUrls($val);
        });
        return response()->json($settings);
    }

    private function normalizeUrls($data)
    {
        if (is_string($data)) {
            // Check if it looks like a local absolute URL
            if (str_contains($data, 'localhost') || str_contains($data, '127.0.0.1')) {
                 $parsed = parse_url($data);
                 if (isset($parsed['path'])) {
                     $path = $parsed['path'];
                     // Handle the local path prefix often seen in WAMP
                     $prefix = '/wed-dt/backend/public';
                     if (str_starts_with($path, $prefix)) {
                         $path = substr($path, strlen($prefix));
                     }
                     return $path;
                 }
            }
            return $data;
        }

        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = $this->normalizeUrls($value);
            }
        }

        return $data;
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

        return response()->json([
            'message' => 'Settings updated successfully',
            'settings' => $allSettings
        ]);
    }
}
