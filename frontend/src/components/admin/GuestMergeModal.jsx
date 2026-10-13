import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, CopyCheck, Merge, EyeOff, Mail, Phone } from 'lucide-react';
import Overlay from '../Overlay';
import Button from '../Button';

const RSVP_STYLES = {
  confirmed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  pending: 'bg-orange-100 text-orange-700',
};
const INVITE_RANK = { pending: 0, sent: 1, opened: 2, responded: 3 };

/** Stable key for a duplicate group, used to remember "not duplicates". */
// eslint-disable-next-line react-refresh/only-export-components
export const groupKey = (group) => group.guests.map((g) => g.id).sort((a, b) => a - b).join('-');

/**
 * The record most worth keeping: one with an RSVP answer, then the furthest
 * invitation, then the most complete details, then the oldest.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function suggestKeeper(guests) {
  const score = (g) => [
    g.rsvp_status && g.rsvp_status !== 'pending' ? 1 : 0,
    INVITE_RANK[g.invitation?.status] ?? -1,
    ['email', 'phone', 'group', 'dietary_notes'].filter((f) => g[f]).length,
    g.parent_guest_id ? 0 : 1,
    -g.id,
  ];
  return [...guests].sort((a, b) => {
    const sa = score(a);
    const sb = score(b);
    for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return sb[i] - sa[i];
    return 0;
  })[0];
}

function DuplicateGroup({ group, highlighted, onMerge, onIgnore }) {
  const [keepId, setKeepId] = useState(() => suggestKeeper(group.guests).id);
  const [mergeIds, setMergeIds] = useState(() => group.guests.map((g) => g.id));
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [highlighted]);

  const toMerge = mergeIds.filter((id) => id !== keepId);
  const keeper = group.guests.find((g) => g.id === keepId);

  const toggleMerge = (id) => setMergeIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const handleMerge = async () => {
    setBusy(true);
    try {
      await onMerge(keepId, toMerge);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      ref={ref}
      className={`bg-white rounded-2xl border overflow-hidden ${highlighted ? 'border-amber-300 ring-2 ring-amber-200' : 'border-stone-200'}`}
    >
      <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-stone-700">{group.guests.length} records</span>
          {group.reasons.map((reason) => (
            <span key={reason} className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold">
              {reason}
            </span>
          ))}
        </div>
        <Button
          size="sm"
          icon={EyeOff}
          onClick={() => onIgnore(group)}
          title="These are different people — stop flagging them"
        >
          Not duplicates
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-stone-400 text-left">
              <th className="px-4 py-2 font-semibold">Keep</th>
              <th className="px-2 py-2 font-semibold">Merge</th>
              <th className="px-2 py-2 font-semibold">Guest</th>
              <th className="px-2 py-2 font-semibold">Contact</th>
              <th className="px-2 py-2 font-semibold">RSVP</th>
              <th className="px-2 py-2 font-semibold">Invite</th>
              <th className="px-4 py-2 font-semibold">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {group.guests.map((guest) => {
              const isKeeper = guest.id === keepId;
              return (
                <tr key={guest.id} className={isKeeper ? 'bg-green-50/50' : ''}>
                  <td className="px-4 py-2.5">
                    <input
                      type="radio"
                      name={`keep-${groupKey(group)}`}
                      checked={isKeeper}
                      onChange={() => setKeepId(guest.id)}
                      aria-label={`Keep ${guest.name}`}
                      className="w-4 h-4 text-[#A67B5B] focus:ring-[#A67B5B]"
                    />
                  </td>
                  <td className="px-2 py-2.5">
                    <input
                      type="checkbox"
                      checked={!isKeeper && mergeIds.includes(guest.id)}
                      disabled={isKeeper}
                      onChange={() => toggleMerge(guest.id)}
                      aria-label={`Merge ${guest.name}`}
                      className="w-4 h-4 rounded border-stone-300 text-[#A67B5B] focus:ring-[#A67B5B] disabled:opacity-30"
                    />
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="font-medium text-stone-800">{guest.name}</div>
                    <div className="text-[10px] font-mono text-stone-400 uppercase">
                      {guest.unique_code}{guest.group ? ` · ${guest.group}` : ''}
                      {guest.parent_guest_id ? ' · plus one' : ''}
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-xs text-stone-500 space-y-0.5">
                    {guest.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{guest.email}</div>}
                    {guest.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{guest.phone}</div>}
                    {!guest.email && !guest.phone && <span className="italic text-stone-300">None</span>}
                  </td>
                  <td className="px-2 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${RSVP_STYLES[guest.rsvp_status] || RSVP_STYLES.pending}`}>
                      {guest.rsvp_status || 'pending'}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-xs text-stone-500 capitalize">{guest.invitation?.status || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-stone-400 whitespace-nowrap">
                    {guest.created_at ? new Date(guest.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-stone-500">
          Keeps <strong>{keeper?.name}</strong> and fills in any missing details, RSVP answer,
          invitation and plus-ones from the merged {toMerge.length === 1 ? 'record' : 'records'}.
        </p>
        <Button
          variant="secondary"
          icon={Merge}
          loading={busy}
          onClick={handleMerge}
          disabled={toMerge.length === 0}
        >
          Merge {toMerge.length} into kept record
        </Button>
      </div>
    </div>
  );
}

/**
 * GuestMergeModal — review groups of likely-duplicate guests and merge each
 * group into a single record so nobody is invited (or counted) twice.
 *
 * @param {boolean}  isOpen
 * @param {function} onClose
 * @param {Array}    groups       - [{ reasons: string[], guests: Guest[] }]
 * @param {number}   [focusGuestId] - Scroll to and highlight this guest's group
 * @param {function} onMerge      - async (keepId, mergeIds) => void
 * @param {function} onIgnore     - (group) => void, mark as "not duplicates"
 */
export default function GuestMergeModal({ isOpen, onClose, groups = [], focusGuestId, onMerge, onIgnore }) {
  if (!isOpen) return null;

  const duplicateCount = groups.reduce((n, g) => n + g.guests.length - 1, 0);

  return (
    <Overlay onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="merge-duplicates-title"
      >
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <CopyCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="merge-duplicates-title" className="text-xl font-semibold text-stone-800">Review Duplicate Guests</h2>
              <p className="text-sm text-stone-500">
                {groups.length > 0
                  ? `${groups.length} ${groups.length === 1 ? 'guest appears' : 'guests appear'} more than once (${duplicateCount} extra ${duplicateCount === 1 ? 'record' : 'records'}). Merge them to avoid double invites and inflated counts.`
                  : 'No duplicates left — every guest is listed once.'}
              </p>
            </div>
          </div>
          <button aria-label="Close" onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-stone-50/30">
          {groups.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <CopyCheck className="w-10 h-10 mx-auto mb-3 text-green-400" />
              All clear.
            </div>
          ) : groups.map((group) => (
            <DuplicateGroup
              key={groupKey(group)}
              group={group}
              highlighted={!!focusGuestId && group.guests.some((g) => g.id === focusGuestId)}
              onMerge={onMerge}
              onIgnore={onIgnore}
            />
          ))}
        </div>
      </motion.div>
    </Overlay>
  );
}
