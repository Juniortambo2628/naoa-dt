<?php

namespace App\Support;

use App\Models\PageContent;
use App\Models\Setting;

/**
 * Backend single source of truth for the wedding's dynamic details, mirroring
 * frontend/src/utils/weddingInfo.js. Values are read Settings-first (the admin
 * Settings page › Wedding Details card), then the legacy Content Manager values,
 * then the canonical defaults — so emails and the calendar never show stale
 * hardcoded couple names, dates or venues.
 */
class WeddingInfo
{
    /** Resolve a possibly-localized content value ({en: ...} or string). */
    protected static function localized($val): ?string
    {
        if ($val === null || $val === '') {
            return null;
        }
        if (is_array($val)) {
            return $val['en'] ?? (reset($val) ?: null);
        }

        return (string) $val;
    }

    protected static function content(string $section, string $field)
    {
        $row = PageContent::where('section_key', $section)->first();

        return $row?->content[$field] ?? null;
    }

    public static function brideName(string $default = 'Dinah'): string
    {
        return Setting::getValue('bride_name')
            ?: (self::localized(self::content('our_story', 'bride_name')) ?: $default);
    }

    public static function groomName(string $default = 'Tze Ren'): string
    {
        return Setting::getValue('groom_name')
            ?: (self::localized(self::content('our_story', 'groom_name')) ?: $default);
    }

    public static function coupleNames(string $default = 'Dinah & Tze Ren'): string
    {
        $bride = Setting::getValue('bride_name');
        $groom = Setting::getValue('groom_name');
        if ($bride || $groom) {
            return trim(self::brideName().' & '.self::groomName());
        }

        return self::localized(self::content('footer', 'couple_names'))
            ?: trim(self::brideName().' & '.self::groomName()) ?: $default;
    }

    /** Machine-readable ISO wedding date. */
    public static function weddingDate(string $default = '2026-11-14'): string
    {
        return Setting::getValue('wedding_date')
            ?: (self::localized(self::content('countdown', 'wedding_date')) ?: $default);
    }

    public static function venueName(string $default = 'The Grand Estate'): string
    {
        return Setting::getValue('venue_name')
            ?: (self::localized(self::content('home_hero', 'venue')) ?: $default);
    }

    public static function venueAddress(string $default = ''): string
    {
        return Setting::getValue('venue_address')
            ?: (self::localized(self::content('home_hero', 'location')) ?: $default);
    }
}
