import { describe, it, expect } from 'vitest';
import { usherRows, chunk, tableLabel } from './usherKit';

const tables = [{ id: 1, name: 'Table 2' }, { id: 2, name: 'Table 10' }];
const guests = [
  { id: 1, name: 'wei Ling', rsvp_status: 'confirmed', table_id: 2 },
  { id: 2, name: 'Achieng', rsvp_status: 'pending', table_id: 1 },
  { id: 3, name: 'Brian', rsvp_status: 'declined', table_id: null },
  { id: 4, name: 'Plus One', rsvp_status: 'confirmed', parent_guest_id: 1, table_id: null, dietary_notes: 'Vegetarian', checked_in_at: '2026-11-14T10:00:00Z' },
];

describe('usherRows', () => {
  it('leaves out declined guests by default and sorts A–Z', () => {
    expect(usherRows(guests, tables).map((r) => r.name)).toEqual(['Achieng', 'Plus One', 'wei Ling']);
  });

  it('can show only confirmed guests, or everyone', () => {
    expect(usherRows(guests, tables, { who: 'confirmed' })).toHaveLength(2);
    expect(usherRows(guests, tables, { who: 'all' })).toHaveLength(4);
  });

  it('names tables, plus-one hosts and check-in', () => {
    const plusOne = usherRows(guests, tables).find((r) => r.id === 4);
    expect(plusOne).toMatchObject({ guestOf: 'wei Ling', notes: 'Vegetarian', checkedIn: true, table: '' });
    expect(usherRows(guests, tables).find((r) => r.id === 1).table).toBe('Table 10');
  });

  it('sorts by table naturally, with no table last', () => {
    expect(usherRows(guests, tables, { sort: 'table' }).map((r) => r.table)).toEqual(['Table 2', 'Table 10', '']);
  });
});

describe('helpers', () => {
  it('chunks cards into pages', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('labels tables once', () => {
    expect(tableLabel('5')).toBe('Table 5');
    expect(tableLabel('Table 5')).toBe('Table 5');
  });
});
