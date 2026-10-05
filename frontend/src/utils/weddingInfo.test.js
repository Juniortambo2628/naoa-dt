import { getCalendarUrl } from './weddingInfo';

describe('getCalendarUrl', () => {
  it('builds a Google Calendar TEMPLATE url from the shared config', () => {
    const url = getCalendarUrl({
      wedding_date: '2026-11-14',
      couple_names: 'Dinah & Tze Ren',
      venue_name: 'Zereniti House',
      venue_address: 'Limuru, Kenya',
    });
    expect(url).toContain('https://calendar.google.com/calendar/render?');
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('action')).toBe('TEMPLATE');
    expect(params.get('text')).toBe('Dinah & Tze Ren');
    expect(params.get('dates')).toBe('20261114T100000/20261114T220000');
    // Prefers the full address over the venue name for the location.
    expect(params.get('location')).toBe('Limuru, Kenya');
  });

  it('handles a datetime wedding_date by using only the date part', () => {
    const url = getCalendarUrl({ wedding_date: '2026-11-14T10:00', venue_name: 'V' });
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('dates')).toBe('20261114T100000/20261114T220000');
    expect(params.get('location')).toBe('V');
  });

  it('allows an explicit title override', () => {
    const url = getCalendarUrl({ wedding_date: '2026-11-14' }, { title: 'Our Wedding' });
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('text')).toBe('Our Wedding');
  });

  it('returns null for an invalid date', () => {
    expect(getCalendarUrl({ wedding_date: 'not-a-date' })).toBeNull();
  });
});
