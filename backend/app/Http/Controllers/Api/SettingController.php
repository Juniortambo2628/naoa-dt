<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Traits\ApiResponse;
use App\Traits\NormalizesUrls;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class SettingController extends Controller
{
    use ApiResponse, NormalizesUrls;

    /**
     * Settings keys that are safe to expose to unauthenticated (guest-facing)
     * callers. These drive the public invitation, guest pages and emails.
     * Everything else (email copy, admin notification config, internal URLs)
     * stays behind auth on the admin `/settings` endpoint.
     */
    public const PUBLIC_KEYS = [
        'wedding_date',
        'bride_name',
        'groom_name',
        'venue_name',
        'venue_address',
        'venue_lat',
        'venue_lng',
        'rsvp_enabled',
        'invitation_theme',
        'save_the_date_theme',
        'invitation_sections',
    ];

    public function index()
    {
        \Illuminate\Support\Facades\Log::info('Fetching settings. Current root: '.request()->root());

        return $this->successResponse($this->formatSettings(Setting::all()));
    }

    /**
     * Public, unauthenticated subset of settings for guest-facing pages.
     * Only the whitelisted keys above are returned.
     */
    public function publicIndex()
    {
        $settings = Setting::whereIn('key', self::PUBLIC_KEYS)->get();

        return $this->successResponse($this->formatSettings($settings));
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'nullable', // Allow strings, arrays, etc.
        ]);

        \Illuminate\Support\Facades\Log::info('Updating settings', ['data' => $data['settings']]);

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
        return $this->successResponse($this->formatSettings(Setting::all()), 'Settings updated successfully');
    }

    /**
     * Turn a collection of Setting models into the key => value map the
     * frontend consumes, decoding JSON values and normalizing stored URLs.
     */
    private function formatSettings(Collection $settings)
    {
        return $settings->pluck('value', 'key')->map(function ($value) {
            $decoded = json_decode($value, true);
            $val = (json_last_error() === JSON_ERROR_NONE && (is_array($decoded) || is_object($decoded))) ? $decoded : $value;

            return $this->normalizeUrls($val);
        });
    }
}
