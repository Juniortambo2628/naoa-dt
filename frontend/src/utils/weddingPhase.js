import { getWeddingDate } from './weddingInfo';

/**
 * After the wedding the site says thank you instead of "you're invited":
 * the photos lead, and things that only mattered for getting there (RSVP,
 * directions, weather, entry pass, seating...) step aside.
 *
 * Admin → Settings → After the wedding sets `wedding_phase`:
 *   'auto' (default): from the day after the wedding date
 *   'after': now (to preview or switch early)
 *   'before': not yet
 */
export const WEDDING_PHASES = [
  { value: 'auto', label: 'Automatically, from the day after the wedding' },
  { value: 'after', label: 'Now' },
  { value: 'before', label: 'Not yet' },
];

export const DEFAULT_THANK_YOU = 'Your presence made this moment even more beautiful and meaningful.';

export function isAfterWedding(settings = {}, content = {}, now = new Date()) {
  const mode = settings?.wedding_phase;
  if (mode === 'after') return true;
  if (mode === 'before') return false;
  const [y, m, d] = String(getWeddingDate(settings, content)).split('T')[0].split('-').map(Number);
  if (!y || !m || !d) return false;
  return now >= new Date(y, m - 1, d + 1);
}

/** Invitation page parts that no longer apply once the wedding is over. */
export const AFTER_WEDDING_HIDDEN_SECTIONS = [
  'envelope', 'card', 'when', 'where', 'rsvp', 'calendar', 'download',
  'programme', 'dressCode', 'map', 'weather', 'emergency',
];

/** Quick actions that no longer apply (gifts, photos and stories stay). */
export const AFTER_WEDDING_HIDDEN_ACTIONS = ['pass', 'location', 'travel', 'seating', 'programme', 'polaroid'];

/** Hide what's done with, on top of what the admin switched off. */
export function sectionsForPhase(show, after) {
  if (!after) return show;
  return Object.fromEntries(Object.entries(show).map(([id, on]) => [id, on && !AFTER_WEDDING_HIDDEN_SECTIONS.includes(id)]));
}

export const thankYouMessage = (settings) => (settings?.thank_you_message || '').trim() || DEFAULT_THANK_YOU;
