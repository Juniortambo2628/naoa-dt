/**
 * Guest notices: the short informational notes shown to guests on the
 * landing-page hero and the digital invitation (Admin → Settings →
 * Guest Notices). Stored in the public `guest_notices` setting as an
 * array of { id, icon, enabled, text }; anything not stored falls back
 * to the defaults below, so notices the couple hasn't touched yet still
 * appear with sensible copy.
 */
export const DEFAULT_GUEST_NOTICES = [
  { id: 'invite_only', icon: 'invite', enabled: true, text: 'Invite only — no plus ones' },
  { id: 'no_kids', icon: 'kids', enabled: true, text: 'No kids, please' },
  { id: 'cash_gifts', icon: 'gifts', enabled: true, text: 'Cash gifts warmly appreciated' },
  { id: 'dress_code', icon: 'dress', enabled: true, text: 'Dress code: dress your best' },
];

const isNotice = (n) => !!n && typeof n === 'object' && !Array.isArray(n);

/**
 * Merge the stored setting with the defaults: defaults keep their order and
 * icon, overridden by any stored text/enabled flag; stored notices with
 * unknown ids are custom additions and follow the defaults.
 */
export function resolveGuestNotices(stored) {
  const list = Array.isArray(stored) ? stored.filter(isNotice) : [];
  const byId = new Map(list.map(n => [n.id, n]));

  const defaults = DEFAULT_GUEST_NOTICES.map((d) => {
    const n = byId.get(d.id);
    return {
      ...d,
      ...(n && typeof n.text === 'string' && n.text.trim() ? { text: n.text.trim() } : {}),
      ...(n && typeof n.enabled === 'boolean' ? { enabled: n.enabled } : {}),
    };
  });

  const custom = list.filter(n => !DEFAULT_GUEST_NOTICES.some(d => d.id === n.id));

  return [...defaults, ...custom];
}

/** Notices a guest actually sees (enabled with non-empty copy). */
export function visibleGuestNotices(stored) {
  return resolveGuestNotices(stored).filter(n => n.enabled !== false && String(n.text || '').trim());
}
