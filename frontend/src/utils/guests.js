import { isInviteSent, guestListLink } from './rsvp';

/*
 * Guest list filtering, statistics and to-dos, shared by the Guest List,
 * its URL parameters (/guests?status=pending&invite=unsent) and the
 * Dashboard so every number and link agrees.
 */

export const STALE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export const STATUS_FILTERS = [
  { id: 'active', label: 'Pending + Confirmed' },
  { id: 'all', label: 'All' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'pending', label: 'Pending' },
  { id: 'declined', label: 'Declined' },
];

export const INVITE_FILTERS = [
  { id: 'all', label: 'Any' },
  { id: 'unsent', label: 'Not sent yet' },
  { id: 'sent', label: 'Sent' },
];

export const NEEDS_FILTERS = [
  { id: 'none', label: 'Anything' },
  { id: 'stale', label: `No reply ${STALE_DAYS}+ days` },
  { id: 'no_contact', label: 'No phone or email' },
  { id: 'no_table', label: 'Confirmed, no table' },
  { id: 'dietary', label: 'Dietary notes' },
  { id: 'duplicates', label: 'Possible duplicates' },
];

export const DEFAULT_GUEST_FILTERS = { status: 'active', group: 'all', invite: 'all', needs: 'none' };

/** Read filters from URL search params, falling back to the defaults. */
export function filtersFromParams(params) {
  const pick = (key, options) => {
    const value = params.get(key);
    return value && (!options || options.some((o) => o.id === value)) ? value : DEFAULT_GUEST_FILTERS[key];
  };
  return {
    status: pick('status', STATUS_FILTERS),
    group: params.get('group') || DEFAULT_GUEST_FILTERS.group,
    invite: pick('invite', INVITE_FILTERS),
    needs: pick('needs', NEEDS_FILTERS),
  };
}

/** URL params for non-default filters (inverse of filtersFromParams). */
export function filtersToParams(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([key, value]) => value !== DEFAULT_GUEST_FILTERS[key]));
}

const statusOf = (guest) => guest.rsvp_status || 'pending';

/** Waiting for a reply for STALE_DAYS since the invite (or since being added). */
export function isStale(guest, now = Date.now()) {
  if (statusOf(guest) !== 'pending') return false;
  const since = guest.invitation?.sent_at || guest.created_at;
  return !!since && now - new Date(since).getTime() >= STALE_DAYS * DAY_MS;
}

const NEEDS = {
  none: () => true,
  stale: (g) => isStale(g),
  no_contact: (g) => !g.email && !g.phone,
  no_table: (g) => statusOf(g) === 'confirmed' && !g.table_id,
  dietary: (g) => !!(g.dietary_notes && g.dietary_notes.trim()),
  duplicates: (g, ctx) => !!ctx.duplicateIds?.has(g.id),
};

export function matchesStatus(guest, status) {
  if (status === 'all') return true;
  if (status === 'active') return statusOf(guest) !== 'declined';
  return statusOf(guest) === status;
}

export function matchesGuestFilters(guest, filters, ctx = {}) {
  return matchesStatus(guest, filters.status)
    && (filters.group === 'all' || (guest.group || '') === filters.group)
    && (filters.invite === 'all' || (filters.invite === 'sent') === isInviteSent(guest))
    && (NEEDS[filters.needs] || NEEDS.none)(guest, ctx);
}

/** Free-text search across name, email, group and code; phone by digits. */
export function matchesGuestSearch(guest, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, '');
  return [guest.name, guest.email, guest.group, guest.unique_code].some((v) => v && String(v).toLowerCase().includes(q))
    || (digits.length >= 3 && String(guest.phone || '').replace(/\D/g, '').includes(digits));
}

export function guestStats(guests) {
  const count = (fn) => guests.filter(fn).length;
  const confirmed = count((g) => statusOf(g) === 'confirmed');
  const declined = count((g) => statusOf(g) === 'declined');
  const plusOnes = count((g) => g.parent_guest_id);
  return {
    total: guests.length,
    primary: guests.length - plusOnes,
    plusOnes,
    confirmed,
    declined,
    pending: guests.length - confirmed - declined,
    responded: confirmed + declined,
    invitesSent: count(isInviteSent),
  };
}

/** Distinct, sorted group names in the list. */
export const guestGroups = (guests) => [...new Set(guests.map((g) => g.group).filter(Boolean))].sort((a, b) => a.localeCompare(b));

/**
 * Planning to-dos with counts and a link to the matching guest list.
 * @returns {Array<{ id, count, label, hint, to }>} only items with work to do
 */
export function guestTodos(guests, { duplicateCount = 0 } = {}) {
  const count = (needs, extra = {}) => guests.filter((g) => matchesGuestFilters(g, { ...DEFAULT_GUEST_FILTERS, status: 'all', needs, ...extra })).length;
  const unsent = guests.filter((g) => statusOf(g) === 'pending' && !isInviteSent(g)).length;
  return [
    { id: 'unsent', count: unsent, label: 'invitations not sent yet', hint: 'Pending guests who have no invite', to: guestListLink({ status: 'pending', invite: 'unsent' }) },
    { id: 'duplicates', count: duplicateCount, label: 'possible duplicate records', hint: 'Merge them so nobody is invited twice', to: guestListLink({ status: 'all', needs: 'duplicates' }) },
    { id: 'stale', count: count('stale'), label: `guests haven't replied in ${STALE_DAYS}+ days`, hint: 'A friendly reminder may help', to: guestListLink({ status: 'pending', needs: 'stale' }) },
    { id: 'no_contact', count: count('no_contact'), label: 'guests have no phone or email', hint: "They can't receive an invitation", to: guestListLink({ status: 'all', needs: 'no_contact' }) },
    { id: 'no_table', count: count('no_table'), label: 'confirmed guests without a table', hint: 'Assign them in the seating chart', to: '/admin/dashboard/seating' },
  ].filter((todo) => todo.count > 0);
}

const RSVP_RANK = { confirmed: 0, pending: 1, declined: 2 };

/** Sortable guest columns: compare ascending; `dir` flips it. */
export const GUEST_SORTS = {
  latest: { label: 'Date added', compare: (a, b) => a.id - b.id, defaultDir: 'desc' },
  name: { label: 'Name', compare: (a, b) => (a.name || '').localeCompare(b.name || ''), defaultDir: 'asc' },
  group: { label: 'Group', compare: (a, b) => (a.group || '').localeCompare(b.group || ''), defaultDir: 'asc' },
  status: { label: 'RSVP status', compare: (a, b) => RSVP_RANK[statusOf(a)] - RSVP_RANK[statusOf(b)], defaultDir: 'asc' },
  plus_ones: { label: 'Plus ones', compare: (a, b) => (a.plus_ones?.length || 0) - (b.plus_ones?.length || 0), defaultDir: 'desc' },
};

export const DEFAULT_GUEST_SORT = { key: 'latest', dir: 'desc' };

export function sortGuests(guests, { key, dir } = DEFAULT_GUEST_SORT) {
  const sorter = GUEST_SORTS[key] || GUEST_SORTS.latest;
  const sign = dir === 'desc' ? -1 : 1;
  // Ties fall back to newest first so the order is stable.
  return [...guests].sort((a, b) => sign * sorter.compare(a, b) || b.id - a.id);
}

/** Clicking a column: same column flips direction, a new one starts at its default. */
export const nextSort = (current, key) => (current.key === key
  ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
  : { key, dir: GUEST_SORTS[key]?.defaultDir || 'asc' });
