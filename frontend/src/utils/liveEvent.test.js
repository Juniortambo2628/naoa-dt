import { describe, it, expect } from 'vitest';
import { getLiveStatus } from './liveEvent';

const events = [{
  name: 'Wedding Day',
  event_date: '2026-12-19T00:00:00.000000Z',
  schedule_items: [
    { id: 1, title: 'Ceremony', start_time: '14:00:00', end_time: '15:00:00', status: 'upcoming' },
    { id: 2, title: 'Cocktails', start_time: '15:30:00', end_time: '17:00:00', status: 'upcoming' },
    { id: 3, title: 'Reception', start_time: '18:00:00', end_time: '23:00:00', status: 'upcoming' },
  ],
}];
const at = (t) => new Date(`2026-12-19T${t}:00`);

describe('getLiveStatus', () => {
  it('is "before" ahead of the first item', () => {
    const s = getLiveStatus(events, at('09:00'));
    expect(s.state).toBe('before');
    expect(s.next.title).toBe('Ceremony');
  });

  it('finds the live item by time and the one after it', () => {
    const s = getLiveStatus(events, at('14:30'));
    expect(s.state).toBe('live');
    expect(s.current.title).toBe('Ceremony');
    expect(s.next.title).toBe('Cocktails');
  });

  it('reports the gap between items', () => {
    const s = getLiveStatus(events, at('15:10'));
    expect(s.state).toBe('between');
    expect(s.next.title).toBe('Cocktails');
  });

  it('prefers an item the admin marked current', () => {
    const flagged = [{ ...events[0], schedule_items: events[0].schedule_items.map(i => i.id === 2 ? { ...i, status: 'current' } : i) }];
    expect(getLiveStatus(flagged, at('14:30')).current.title).toBe('Cocktails');
  });

  it('is "after" once everything is over, and "none" without a schedule', () => {
    expect(getLiveStatus(events, at('23:30')).state).toBe('after');
    expect(getLiveStatus([], at('12:00')).state).toBe('none');
  });
});
