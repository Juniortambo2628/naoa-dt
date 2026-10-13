import { Link } from 'react-router-dom';
import { RSVP_STATUSES, RSVP_ORDER, percent, guestListLink } from '../../utils/rsvp';

/** Stacked confirmed / pending / declined bar; each segment links to its guests. */
export default function RsvpProgressBar({ stats }) {
  const total = stats.total || 0;
  return (
    <div>
      <div className="flex h-4 rounded-full overflow-hidden bg-stone-100" role="img" aria-label={RSVP_ORDER.map((s) => `${RSVP_STATUSES[s].label} ${stats[s]}`).join(', ')}>
        {total > 0 && RSVP_ORDER.map((status) => (
          stats[status] > 0 && (
            <Link
              key={status}
              to={guestListLink({ status })}
              title={`${RSVP_STATUSES[status].label}: ${stats[status]}`}
              style={{ width: `${(stats[status] / total) * 100}%`, background: RSVP_STATUSES[status].color }}
              className="hover:opacity-80 transition-opacity"
            />
          )
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {RSVP_ORDER.map((status) => (
          <Link key={status} to={guestListLink({ status })} className="flex items-center gap-2 text-stone-700 hover:text-[#A67B5B]">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: RSVP_STATUSES[status].color }} aria-hidden="true" />
            {RSVP_STATUSES[status].label} <strong>{stats[status]}</strong>
            <span className="text-stone-500">({percent(stats[status], total)})</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
