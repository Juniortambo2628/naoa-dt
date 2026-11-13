/** Helpers for the Usher Kit (printable guest list and guest cards). */

export const WHO_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'expected', label: 'Confirmed + awaiting reply' },
  { value: 'all', label: 'Everyone invited' },
];

export const SORT_OPTIONS = [
  { value: 'name', label: 'A–Z' },
  { value: 'table', label: 'By table' },
];

const STATUS_LABEL = { confirmed: 'Attending', pending: 'Awaiting reply', declined: 'Declined' };

const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

/** Table names sort naturally ("Table 2" before "Table 10"); no table goes last. */
const byTable = (a, b) => {
  if (!a.table && !b.table) return byName(a, b);
  if (!a.table) return 1;
  if (!b.table) return -1;
  return a.table.localeCompare(b.table, undefined, { numeric: true, sensitivity: 'base' }) || byName(a, b);
};

/**
 * One row per guest (plus-ones included, under their own name), filtered by
 * RSVP and sorted for the ushers.
 */
export function usherRows(guests = [], tables = [], { who = 'expected', sort = 'name' } = {}) {
  const tableName = new Map(tables.map((t) => [t.id, t.name]));
  const nameById = new Map(guests.map((g) => [g.id, g.name]));

  const keep = (status) => {
    if (who === 'confirmed') return status === 'confirmed';
    if (who === 'expected') return status !== 'declined';
    return true;
  };

  const rows = guests
    .filter((g) => g?.name && keep(g.rsvp_status || 'pending'))
    .map((g) => {
      const status = g.rsvp_status || 'pending';
      return {
        id: g.id,
        name: String(g.name).trim(),
        table: g.table?.name || tableName.get(g.table_id) || '',
        group: g.group || '',
        status,
        statusLabel: STATUS_LABEL[status] || status,
        guestOf: g.parent_guest_id ? (g.parent_guest?.name || nameById.get(g.parent_guest_id) || '') : '',
        notes: g.dietary_notes || '',
        checkedIn: Boolean(g.checked_in_at),
      };
    });

  return rows.sort(sort === 'table' ? byTable : byName);
}

/** "5" -> "Table 5"; a name that already says it ("Table 5", "Family table") stays. */
export const tableLabel = (name = '') => (/table/i.test(name) ? name : `Table ${name}`);

/** [1..10] in 4s -> [[1..4], [5..8], [9, 10]] */
export function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}
