import {
  filtersFromParams, filtersToParams, matchesGuestFilters, matchesGuestSearch, guestStats, guestTodos,
  sortGuests, nextSort, isStale, DEFAULT_GUEST_FILTERS,
} from './guests'

const old = new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString()
const guests = [
  { id: 1, name: 'Ann', group: 'Family', rsvp_status: 'confirmed', email: 'a@x.com', table_id: null, invitation: { status: 'sent' } },
  { id: 2, name: 'Ben', group: 'Friends', rsvp_status: 'pending', phone: '0712 345 678', created_at: old },
  { id: 3, name: 'Cid', group: 'Family', rsvp_status: 'declined', email: null, phone: null },
]

describe('guest filters', () => {
  it('round-trips URL params and ignores unknown values', () => {
    const f = filtersFromParams(new URLSearchParams('status=pending&invite=unsent&needs=bogus&group=Family'))
    expect(f).toEqual({ status: 'pending', group: 'Family', invite: 'unsent', needs: 'none' })
    expect(filtersToParams(f)).toEqual({ status: 'pending', group: 'Family', invite: 'unsent' })
  })

  it('defaults to pending + confirmed', () => {
    expect(guests.filter((g) => matchesGuestFilters(g, DEFAULT_GUEST_FILTERS)).map((g) => g.id)).toEqual([1, 2])
  })

  it('combines status, group, invite and needs', () => {
    const f = { ...DEFAULT_GUEST_FILTERS, status: 'all', group: 'Family', needs: 'no_contact' }
    expect(guests.filter((g) => matchesGuestFilters(g, f)).map((g) => g.id)).toEqual([3])
    expect(guests.filter((g) => matchesGuestFilters(g, { ...DEFAULT_GUEST_FILTERS, invite: 'unsent' })).map((g) => g.id)).toEqual([2])
  })

  it('searches text fields and phone digits', () => {
    expect(matchesGuestSearch(guests[1], '345678')).toBe(true)
    expect(matchesGuestSearch(guests[0], 'family')).toBe(true)
    expect(matchesGuestSearch(guests[0], 'zzz')).toBe(false)
  })

  it('flags guests waiting 14+ days', () => {
    expect(isStale(guests[1])).toBe(true)
    expect(isStale(guests[0])).toBe(false)
  })
})

describe('guest stats & to-dos', () => {
  it('counts statuses and sent invites', () => {
    expect(guestStats(guests)).toMatchObject({ total: 3, confirmed: 1, pending: 1, declined: 1, responded: 2, invitesSent: 1 })
  })

  it('lists only to-dos with work, linking to filtered lists', () => {
    const todos = guestTodos(guests, { duplicateCount: 2 })
    const byId = Object.fromEntries(todos.map((t) => [t.id, t]))
    expect(byId.unsent.count).toBe(1)
    expect(byId.unsent.to).toBe('/admin/dashboard/guests?status=pending&invite=unsent')
    expect(byId.duplicates.count).toBe(2)
    expect(byId.no_table.count).toBe(1)
  })
})

describe('sorting', () => {
  it('sorts by column and flips direction on repeat clicks', () => {
    expect(sortGuests(guests, { key: 'name', dir: 'desc' }).map((g) => g.name)).toEqual(['Cid', 'Ben', 'Ann'])
    expect(sortGuests(guests, { key: 'status', dir: 'asc' }).map((g) => g.rsvp_status)).toEqual(['confirmed', 'pending', 'declined'])
    expect(nextSort({ key: 'name', dir: 'asc' }, 'name')).toEqual({ key: 'name', dir: 'desc' })
    expect(nextSort({ key: 'name', dir: 'asc' }, 'latest')).toEqual({ key: 'latest', dir: 'desc' })
  })
})
