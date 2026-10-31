/**
 * Admin modules (pages) by key. The keys match the backend's revision modules
 * (sidebar badges, version history) and what collaborators' presence reports.
 */
export const ADMIN_MODULES = [
  { key: 'dashboard', path: '/admin/dashboard', label: 'Dashboard' },
  { key: 'guests', path: '/admin/dashboard/guests', label: 'Guests' },
  { key: 'rsvps', path: '/admin/dashboard/rsvps', label: 'RSVPs & Messages' },
  { key: 'seating', path: '/admin/dashboard/seating', label: 'Seating Chart' },
  { key: 'design', path: '/admin/dashboard/design', label: 'Design Invitations' },
  { key: 'content', path: '/admin/dashboard/content', label: 'CMS' },
  { key: 'modules', path: '/admin/dashboard/modules', label: 'Modules' },
  { key: 'gallery', path: '/admin/dashboard/gallery', label: 'Gallery' },
  { key: 'schedule', path: '/admin/dashboard/schedule', label: 'Schedule' },
  { key: 'faqs', path: '/admin/dashboard/faqs', label: 'FAQs' },
  { key: 'songs', path: '/admin/dashboard/songs', label: 'Song Requests' },
  { key: 'guestbook', path: '/admin/dashboard/guestbook', label: 'Write to Us' },
  { key: 'enquiries', path: '/admin/dashboard/enquiries', label: 'Enquiries' },
  { key: 'gifts', path: '/admin/dashboard/gifts', label: 'Gifts' },
  { key: 'announcements', path: '/admin/dashboard/announcements', label: 'Announcements' },
  { key: 'analytics', path: '/admin/dashboard/analytics', label: 'Analytics' },
  { key: 'checkin', path: '/admin/dashboard/checkin', label: 'Check-In' },
  { key: 'emails', path: '/admin/dashboard/emails', label: 'Email Templates' },
  { key: 'test', path: '/admin/dashboard/test', label: 'Test Lab' },
  { key: 'settings', path: '/admin/dashboard/settings', label: 'Settings' },
  { key: 'users', path: '/admin/dashboard/users', label: 'Users' },
  { key: 'backups', path: '/admin/dashboard/backups', label: 'Backups' },
];

const BY_KEY = Object.fromEntries(ADMIN_MODULES.map((m) => [m.key, m]));

export const moduleByKey = (key) => BY_KEY[key] || null;

/** The module a dashboard URL belongs to (longest matching path wins). */
export function moduleForPath(pathname = '') {
  const path = pathname.replace(/\/+$/, '') || '/';
  let best = null;
  for (const m of ADMIN_MODULES) {
    if ((path === m.path || path.startsWith(`${m.path}/`)) && (!best || m.path.length > best.path.length)) best = m;
  }
  return best;
}

/** "Dinah Wong" -> "DW" */
export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?';
}

/** A stable soft colour per collaborator, so the same person always looks the same. */
const COLLABORATOR_COLORS = ['#A67B5B', '#6B8E7F', '#8B6FA6', '#C27C5A', '#5B7FA6', '#A65B7B', '#7F8E5B'];
export const collaboratorColor = (id = 0) => COLLABORATOR_COLORS[Math.abs(Number(id) || 0) % COLLABORATOR_COLORS.length];
