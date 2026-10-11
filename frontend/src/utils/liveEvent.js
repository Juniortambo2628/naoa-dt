/**
 * Works out what is happening right now from the public schedule
 * (`/schedule/full`: events with nested schedule items).
 *
 * An item the admin has marked `current` always wins; otherwise the item whose
 * start/end window contains `now` is live. Times are read as local wall-clock
 * time on the event date.
 */
const toDate = (eventDate, time) => {
  if (!eventDate || !time) return null;
  const day = String(eventDate).slice(0, 10);
  const [h = '0', m = '0'] = String(time).split(':');
  const d = new Date(`${day}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(Number(h), Number(m), 0, 0);
  return d;
};

export function flattenSchedule(events = []) {
  return events
    .flatMap(event => (event.schedule_items || event.scheduleItems || []).map(item => {
      const start = toDate(event.event_date, item.start_time);
      let end = toDate(event.event_date, item.end_time);
      if (start && end && end <= start) end = new Date(end.getTime() + 24 * 3600 * 1000); // runs past midnight
      return { ...item, event_name: event.name, start, end };
    }))
    .filter(item => item.start)
    .sort((a, b) => a.start - b.start);
}

export function getLiveStatus(events, now = new Date()) {
  const items = flattenSchedule(events);
  if (items.length === 0) return { state: 'none' };

  const flagged = items.find(i => i.status === 'current');
  const timed = items.find(i => i.start <= now && (i.end ? now < i.end : false));
  const current = flagged || timed || null;
  const next = items.find(i => i.start > now && i !== current && i.status !== 'completed') || null;

  if (current) return { state: 'live', current, next };

  const first = items[0];
  const last = items[items.length - 1];
  if (now < first.start) return { state: 'before', next: first };
  if (now >= (last.end || last.start) && !next) return { state: 'after' };
  return { state: 'between', next };
}

export const formatTime = (date) =>
  date ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
