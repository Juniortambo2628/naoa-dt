/**
 * Single source of truth for the *fallback* wedding details used when the CMS
 * (Content Manager / Settings) has no value configured yet.
 *
 * Live values always come from the CMS via `getWeddingInfo` / ContentContext;
 * these constants are only the last-resort defaults. Keeping them in one place
 * stops the UI from drifting apart — previously the date fell back to three
 * different values (`2026-11-14`, `2025-06-15`, `June 15th 2025`) depending on
 * which component rendered it.
 */
export const WEDDING_DEFAULTS = {
  coupleNames: 'Dinah & Tze Ren',
  brideName: 'Dinah',
  groomName: 'Tze Ren',
  // Canonical wedding date (ISO, date-only). This matches the value already
  // used by the invitation designer, exporter and guest invitation.
  weddingDate: '2026-11-14',
  // Human-readable form of weddingDate, kept in sync with it.
  dateText: 'November 14th, 2026',
  hashtag: '#DinahAndTzeRen2026',
  message: 'Forever & Always',
};

export default WEDDING_DEFAULTS;
