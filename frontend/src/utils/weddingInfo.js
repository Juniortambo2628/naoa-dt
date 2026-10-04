/**
 * Single source of truth for the wedding's dynamic details used across the
 * public site, invitation designer, exporters and emails.
 *
 * The admin **Settings page › Wedding Details** card is the canonical place these
 * values are configured. They are stored as `settings` keys and read everywhere
 * through the helpers below:
 *
 * - Wedding date   -> settings.wedding_date   (ISO "YYYY-MM-DD")
 * - Bride name     -> settings.bride_name
 * - Groom name     -> settings.groom_name
 * - Venue name     -> settings.venue_name
 * - Venue address  -> settings.venue_address
 * - Coordinates    -> settings.venue_lat / settings.venue_lng
 *
 * For backward compatibility (and until the duplicate Content Manager fields are
 * removed) each helper falls back to the legacy Content Manager values, then to
 * the constants in weddingDefaults.js, so nothing breaks if Settings is blank.
 */

import { WEDDING_DEFAULTS } from './weddingDefaults';

const DEFAULT_DATE = WEDDING_DEFAULTS.weddingDate;

// Map the app's language codes to BCP-47 locales for date formatting.
const LOCALE_MAP = { en: 'en-US', zh: 'zh-CN', ms: 'ms-MY', luo: 'en-US' };

/**
 * Resolve a possibly-localized value ({ en, zh, ... } or a plain string) to a
 * string for the requested language, falling back to English. Settings values
 * are normally plain strings but the API permits localized objects, so this is
 * applied to both settings and content values.
 */
export const resolveLocalized = (val, locale = 'en') => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'object') {
    return val[locale] || val.en || val[Object.keys(val)[0]] || null;
  }
  return val;
};

// First non-empty resolved value from the given candidates.
const firstOf = (locale, ...candidates) => {
  for (const c of candidates) {
    const v = resolveLocalized(c, locale);
    if (v !== null && v !== undefined && String(v).trim() !== '') return v;
  }
  return null;
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
 * The machine-readable wedding date (ISO). Settings first, then the legacy
 * Content Manager countdown value, then the canonical default.
 */
export function getWeddingDate(settings = {}, content = {}) {
  return (
    firstOf('en', settings?.wedding_date, content?.countdown?.content?.wedding_date) ||
    DEFAULT_DATE
  );
}

/**
 * The human-readable wedding date string shown across the public pages (hero,
 * footer, programme). Prefers the Settings date (auto-formatted per language),
 * then the admin-entered Content Manager display text, then a formatted
 * countdown date — never a hardcoded literal.
 *
 * Signature keeps `(content, locale)` first for backward compatibility; pass
 * `settings` to honour the centralized date.
 */
export function getWeddingDateText(content = {}, locale = 'en', settings = {}) {
  if (settings?.wedding_date) {
    return formatWeddingDate(resolveLocalized(settings.wedding_date, locale), locale);
  }
  return (
    resolveLocalized(content?.home_hero?.content?.date_text, locale) ||
    formatWeddingDate(content?.countdown?.content?.wedding_date, locale)
  );
}

/**
 * Bride / groom / couple names. Settings first, then the legacy Content Manager
 * values, then the weddingDefaults constants.
 */
export function getCoupleNames(settings = {}, content = {}, locale = 'en') {
  const brideName =
    firstOf(locale, settings?.bride_name, content?.our_story?.content?.bride_name) ||
    WEDDING_DEFAULTS.brideName;
  const groomName =
    firstOf(locale, settings?.groom_name, content?.our_story?.content?.groom_name) ||
    WEDDING_DEFAULTS.groomName;

  // Prefer explicit bride+groom (from either source); otherwise the legacy
  // footer "couple_names" text; otherwise compose from the names.
  const coupleNames =
    (settings?.bride_name || settings?.groom_name
      ? `${brideName} & ${groomName}`
      : firstOf(locale, content?.footer?.content?.couple_names)) ||
    `${brideName} & ${groomName}`;

  return { brideName, groomName, coupleNames };
}

/**
 * Build the dynamic wedding info object consumed by InvitationCanvas /
 * InvitationExportContainer as `weddingSettings`, and usable anywhere the full
 * set of centralized details is needed.
 *
 * @param {object} settings - flat settings map (settingService.getAll result)
 * @param {object} content  - page content map (contentService.getAll result)
 */
export function getWeddingInfo(settings = {}, content = {}, locale = 'en') {
  const venueName =
    firstOf(locale, settings?.venue_name, content?.home_hero?.content?.venue) ||
    'Our Venue';
  const { brideName, groomName, coupleNames } = getCoupleNames(settings, content, locale);

  return {
    wedding_date: getWeddingDate(settings, content),
    bride_name: brideName,
    groom_name: groomName,
    couple_names: coupleNames,
    venue_name: venueName,
    venue_address: firstOf(locale, settings?.venue_address) || '',
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
