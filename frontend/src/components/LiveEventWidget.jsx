import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Clock, MapPin, ChevronRight, Megaphone, CalendarHeart, Hammer } from 'lucide-react';
import { scheduleService } from '../services/api';
import { getLiveStatus, formatTime } from '../utils/liveEvent';

const POLL_MS = 30000;
const RECENT_UPDATE_MS = 2 * 3600 * 1000;

// Live tracker for the wedding programme on the guest invitation: what's
// happening now, what's next, and the latest announcement from the couple.
// While the programme isn't ready (module hidden, no items yet, or only items
// that pre-date the wedding), show the wedding date from Settings instead.
export default function LiveEventWidget({ programmeVisible = true, weddingDate, weddingDateText }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [timeline, live] = await Promise.all([
          scheduleService.getTimeline(),
          scheduleService.getLiveUpdates(),
        ]);
        if (cancelled) return;
        setEvents(Array.isArray(timeline.data) ? timeline.data : []);
        setUpdates(Array.isArray(live.data) ? live.data : []);
      } catch {
        if (!cancelled) setEvents(prev => prev ?? []);
      }
      if (!cancelled) setNow(new Date());
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (!events) return null;
  const status = getLiveStatus(events, now);

  const weddingDayEnd = weddingDate ? new Date(`${String(weddingDate).slice(0, 10)}T23:59:59`) : null;
  const weddingAhead = weddingDayEnd && !Number.isNaN(weddingDayEnd.getTime()) && now <= weddingDayEnd;
  const comingSoon = !programmeVisible || status.state === 'none' || (status.state === 'after' && weddingAhead);

  if (comingSoon) {
    return (
      <section className="rounded-2xl overflow-hidden border border-palette-forest/20 bg-white shadow-sm">
        <div className="px-5 py-3 bg-palette-forest text-palette-cream flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <Hammer className="w-4 h-4" /> Programme coming soon
        </div>
        <div className="p-5 flex gap-4 items-center">
          <div className="w-12 h-12 rounded-xl bg-palette-cream text-palette-cinnamon flex items-center justify-center shrink-0">
            <CalendarHeart className="w-6 h-6" />
          </div>
          <div>
            {weddingDateText && <p className="text-lg font-serif text-palette-cinnamon">{weddingDateText}</p>}
            <p className="text-sm text-stone-500">
              We're still putting the finishing touches on the day's programme. Check back here for live updates on the day!
            </p>
          </div>
        </div>
      </section>
    );
  }

  const latest = updates[0];
  const showUpdate = latest && now - new Date(latest.created_at) < RECENT_UPDATE_MS;

  return (
    <section className="rounded-2xl overflow-hidden border border-palette-forest/20 bg-white shadow-sm" aria-live="polite">
      <div className="px-5 py-3 bg-palette-forest text-palette-cream flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          {status.state === 'live' ? (
            <span className="relative flex w-2.5 h-2.5">
              <span className="absolute inset-0 rounded-full bg-palette-burnt-orange animate-ping opacity-75" />
              <span className="relative w-2.5 h-2.5 rounded-full bg-palette-burnt-orange" />
            </span>
          ) : <Radio className="w-4 h-4" />}
          {status.state === 'live' ? 'Happening now' : status.state === 'after' ? 'That’s a wrap' : 'Live programme'}
        </div>
        <span className="text-[11px] opacity-80">Updated {formatTime(now)}</span>
      </div>

      <div className="p-5 space-y-4">
        {status.state === 'live' && (
          <div>
            <p className="text-xl font-serif text-palette-cinnamon">{status.current.title}</p>
            <p className="text-xs text-stone-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(status.current.start)}{status.current.end ? ` – ${formatTime(status.current.end)}` : ''}</span>
              {status.current.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{status.current.location}</span>}
            </p>
          </div>
        )}

        {status.state === 'after' && (
          <p className="text-sm text-stone-600">The celebrations are over — thank you for being part of our day!</p>
        )}

        {status.next && (
          <div className={status.state === 'live' ? 'pt-3 border-t border-stone-100' : ''}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-palette-olive">
              {status.state === 'before' ? 'First up' : 'Up next'}
            </p>
            <p className="text-sm font-semibold text-stone-800">{status.next.title}</p>
            <p className="text-xs text-stone-500">
              {status.state === 'before' && status.next.start.toDateString() !== now.toDateString()
                ? status.next.start.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) + ' · '
                : ''}
              {formatTime(status.next.start)}{status.next.location ? ` · ${status.next.location}` : ''}
            </p>
          </div>
        )}

        {showUpdate && (
          <div className="flex gap-2 p-3 rounded-xl bg-palette-cream/60 text-sm text-stone-700">
            <Megaphone className="w-4 h-4 mt-0.5 shrink-0 text-palette-rust" />
            <p>{latest.message}</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate('/programme')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-palette-forest/30 text-palette-forest font-semibold text-sm hover:bg-palette-forest/5 transition-colors"
        >
          View full programme <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
