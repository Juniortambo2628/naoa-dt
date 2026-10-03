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

const DEFAULT_DATE = '2026-11-14';

const resolveLocalized = (val) => {
  if (!val) return null;
  if (typeof val === 'object') return val.en || val[Object.keys(val)[0]] || null;
  return val;
};

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
