/**
 * Parts of the guest invitation page that admins can show or hide
 * (Admin → Settings → Guest Invitation Page). Stored in the public
 * `invitation_sections` setting as { [id]: boolean }; anything not stored
 * is shown, so new sections appear by default.
 */
export const INVITATION_SECTIONS = [
  { id: 'card', label: 'Invitation card', hint: 'The designed card beside the welcome text (desktop).' },
  { id: 'welcome', label: 'Welcome message', hint: 'The greeting paragraph under "You\'re Invited!".' },
  { id: 'when', label: 'When (date)', hint: 'Wedding date card.' },
  { id: 'where', label: 'Where (venue)', hint: 'Venue name card.' },
  { id: 'rsvp', label: 'RSVP button & status', hint: 'Respond button, or the guest\'s current RSVP status.' },
  { id: 'calendar', label: 'Add to Calendar', hint: 'Calendar download button.' },
  { id: 'programme', label: 'Live programme', hint: 'Happening now / up next widget.' },
  { id: 'dressCode', label: 'Dress code palette', hint: 'Wedding colours, shades and combinations.' },
  { id: 'map', label: 'Map & directions', hint: 'Venue map with travel estimate.' },
  { id: 'weather', label: 'Weather', hint: 'Forecast for the wedding day.' },
  { id: 'emergency', label: 'Emergency numbers', hint: 'Contacts for the day.' },
  { id: 'signoff', label: 'Sign-off', hint: '"With love" and the couple\'s names.' },
  { id: 'quickActions', label: 'Quick actions button', hint: 'Floating menu: location, travel, seating, programme, polaroid.' },
];

export function resolveInvitationSections(stored) {
  const value = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  return Object.fromEntries(INVITATION_SECTIONS.map(s => [s.id, value[s.id] !== false]));
}
