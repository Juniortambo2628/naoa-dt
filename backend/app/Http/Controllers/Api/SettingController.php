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

            // Sync with PageContent
            if ($key === 'wedding_date') {
                // 1. Update Countdown
                $content = PageContent::firstOrNew(['section_key' => 'countdown']);
                $currentContent = $content->content ?? [];
                $currentContent['wedding_date'] = $value;
                if (!isset($currentContent['title'])) $currentContent['title'] = ['en' => 'Counting Down'];
                if (!isset($currentContent['subtitle'])) $currentContent['subtitle'] = ['en' => 'Until We Say "I Do"'];
                $content->content = $currentContent;
                $content->is_visible = true; // Ensure visible
                $content->save();

                // 2. Update Hero, Programme, and RSVP Date Text (Formatted)
                try {
                    $date = \Carbon\Carbon::parse($value);
                    $formattedDate = $date->format('F jS, Y'); // e.g., "June 15th, 2025"
                    
                    // Home Hero
                    $hero = PageContent::firstOrNew(['section_key' => 'home_hero']);
                    $heroContent = $hero->content ?? [];
                    $heroContent['date_text'] = $formattedDate;
                    $hero->content = $heroContent;
                    $hero->is_visible = true;
                    $hero->save();

                    // Programme Page
                    $prog = PageContent::firstOrNew(['section_key' => 'programme_page']);
                    $progContent = $prog->content ?? [];
                    $progContent['date'] = $formattedDate;
                    $prog->content = $progContent;
                    $prog->is_visible = true;
                    $prog->save();

                    // RSVP Page
                    $rsvp = PageContent::firstOrNew(['section_key' => 'rsvp_page']);
                    $rsvpContent = $rsvp->content ?? [];
                    $rsvpContent['date'] = $formattedDate;
                    $rsvp->content = $rsvpContent;
                    $rsvp->is_visible = true;
                    $rsvp->save();

                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Date parse error: " . $e->getMessage());
                }
            }

            if ($key === 'venue_name') {
                // Update Hero Location
                $hero = PageContent::firstOrNew(['section_key' => 'home_hero']);
                $heroContent = $hero->content ?? [];
                $heroContent['location'] = $value;
                $hero->content = $heroContent;
                $hero->is_visible = true;
                $hero->save();
            }
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
