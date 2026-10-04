/**
 * Single source of truth for the wedding's dynamic details used across the
 * invitation designer, exporters and public invitation view.
 *
 * - Wedding date  -> Content Manager › Home › Countdown (`countdown.wedding_date`)
 * - Venue name    -> Content Manager › Home › Hero (`home_hero.venue`)
 * - Venue address -> Settings (`venue_address`)
 * - Coordinates   -> Settings (`venue_lat` / `venue_lng`)
 *
 * Nothing here should read the legacy `settings.wedding_date` value, which is a
 * stale seeded default and is NOT where admins configure the date.
 */

import { WEDDING_DEFAULTS } from './weddingDefaults';

const DEFAULT_DATE = WEDDING_DEFAULTS.weddingDate;

// Map the app's language codes to BCP-47 locales for date formatting.
const LOCALE_MAP = { en: 'en-US', zh: 'zh-CN', ms: 'ms-MY', luo: 'en-US' };

/**
 * Resolve a possibly-localized content value ({ en, zh, ... } or a plain string)
 * to a string for the requested language, falling back to English.
 */
export const resolveLocalized = (val, locale = 'en') => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'object') {
    return val[locale] || val.en || val[Object.keys(val)[0]] || null;
  }
  return val;
};

/**
 * Format a wedding date value into a human-readable string. Accepts a date
 * ("YYYY-MM-DD") or datetime ("YYYY-MM-DDTHH:MM") and builds the date in local
 * time so the displayed day never shifts across timezones.
 */
export function formatWeddingDate(weddingDate, locale = 'en') {
  const raw = (weddingDate || DEFAULT_DATE).split('T')[0];
  const [y, m, d] = raw.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dateObj = new Date(y, m - 1, d);
  if (Number.isNaN(dateObj.getTime())) return '';
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  try {
    return dateObj.toLocaleDateString(LOCALE_MAP[locale] || 'en-US', opts);
  } catch {
    return dateObj.toLocaleDateString('en-US', opts);
  }
}

/**
 * The human-readable wedding date string shown across the public pages (hero,
 * footer, programme). Prefers the admin-entered display text
 * (`home_hero.date_text`), then a formatted `countdown.wedding_date` — never a
 * hardcoded literal. `content` is the content map (contentService / useContent).
 */
export function getWeddingDateText(content = {}, locale = 'en') {
  return (
    resolveLocalized(content?.home_hero?.content?.date_text, locale) ||
    formatWeddingDate(content?.countdown?.content?.wedding_date, locale)
  );
}

/**
 * Build the dynamic wedding info object consumed by InvitationCanvas /
 * InvitationExportContainer as `weddingSettings`.
 *
 * @param {object} settings - flat settings map (settingService.getAll result)
 * @param {object} content  - page content map (contentService.getAll result)
 */
export function getWeddingInfo(settings = {}, content = {}) {
  const venueName =
    resolveLocalized(content?.home_hero?.content?.venue) ||
    settings?.venue_name ||
    'Our Venue';

  return {
    wedding_date: content?.countdown?.content?.wedding_date || DEFAULT_DATE,
    venue_name: venueName,
    venue_address: settings?.venue_address || '',
    venue_lat: settings?.venue_lat || '',
    venue_lng: settings?.venue_lng || '',
    public_url: settings?.public_url || '',
  };
}

/**
 * Build a Google Maps URL for the configured venue. Prefers exact coordinates
 * and falls back to a text search of the address / name. Returns null when
 * there is nothing to point at.
 */
export function getMapUrl(info = {}) {
  const { venue_lat, venue_lng, venue_address, venue_name } = info;
  if (venue_lat && venue_lng) {
    return `https://www.google.com/maps/search/?api=1&query=${venue_lat},${venue_lng}`;
  }
  const query = venue_address || venue_name;
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}
