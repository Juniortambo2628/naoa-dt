import { useEffect, useMemo, useRef, useState } from 'react';
import {
  QrCode, UserCheck, Users, AlertCircle, CheckCircle, RefreshCw, Search, Undo2, Armchair, AlertTriangle,
} from 'lucide-react';
import { useCheckinStats, useGuests } from '../../hooks/useApiHooks';
import { checkinService } from '../../services/api';
import AdminCard from '../../components/admin/AdminCard';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminSummaryCards from '../../components/admin/AdminSummaryCards';
import Button from '../../components/Button';
import useAdminAction from '../../hooks/useAdminAction';
import { tableLabel } from '../../utils/usherKit';
import QrCamera from '../../components/admin/QrCamera';

const INVALIDATE = [['checkinStats'], ['guests']];
/** How long a result stays up before the camera looks for the next guest. */
const NEXT_SCAN_MS = 2500;

/** Arrival result: who it is, where they sit, anything the usher should know. */
function ResultPanel({ result, onClear }) {
  if (!result) return null;
  const { kind, message, guest } = result;
  const tone = {
    ok: 'bg-green-50 border-green-200 text-green-800',
    already: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-700',
  }[kind];
  const Icon = kind === 'ok' ? CheckCircle : kind === 'already' ? AlertTriangle : AlertCircle;
  const declined = guest?.rsvp_status === 'declined';
  const awaiting = guest && !declined && guest.rsvp_status !== 'confirmed';

  return (
    <div role="status" aria-live="polite" className={`mt-4 p-4 rounded-xl border ${tone}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-8 h-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-lg leading-tight">{message}</p>
          {guest && (
            <div className="mt-2 space-y-1 text-sm text-stone-700">
              <p className="flex items-center gap-1.5 font-medium">
                <Armchair className="w-4 h-4 text-[#A67B5B]" />
                {guest.table?.name ? tableLabel(guest.table.name) : 'No table assigned'}
              </p>
              {guest.guest_of && <p>Guest of {guest.guest_of}</p>}
              {guest.dietary_notes && <p>Note: {guest.dietary_notes}</p>}
              {awaiting && <p className="text-stone-600">Hadn&apos;t replied to the RSVP. They&apos;re on the list, so welcome them in.</p>}
              {declined && <p className="font-medium text-amber-700">RSVP: declined. Check with the coordinator before seating them.</p>}
            </div>
          )}
        </div>
        <button type="button" onClick={onClear} className="text-xs underline text-stone-500 shrink-0">Clear</button>
      </div>
    </div>
  );
}

/**
 * Check-in at the door. Every guest's QR (on their printed card and their
 * digital invitation) holds their invitation link; scanning it here marks
 * them arrived. Guests without a code are found by name and checked in by hand.
 */
export default function CheckInScanner() {
  const { data: statsData, refetch: refetchStats } = useCheckinStats();
  const { data: guestsData = [] } = useGuests();
  const [held, setHeld] = useState(false);
  const [result, setResult] = useState(null);
  const [query, setQuery] = useState('');
  const busyRef = useRef(false);
  const timerRef = useRef(null);

  const stats = statsData || { total_expected: 0, checked_in: 0, remaining: 0, percentage: 0 };
  const guests = useMemo(() => (Array.isArray(guestsData) ? guestsData : []), [guestsData]);

  const showOutcome = (res) => setResult({ kind: 'ok', message: `Welcome, ${res.data?.guest?.name || 'guest'}!`, guest: res.data?.guest });
  const showFailure = (err) => {
    const data = err?.response?.data || {};
    setResult({
      kind: data.errors?.guest ? 'already' : 'error',
      message: data.message || 'Check-in failed. Try again, or find the guest by name.',
      guest: data.errors?.guest,
    });
  };

  const scan = useAdminAction((code) => checkinService.scan({ qr_code: code }), {
    role: 'checkin',
    error: false,
    key: () => 'scan',
    invalidate: INVALIDATE,
    onSuccess: showOutcome,
    onError: showFailure,
  });

  const checkInByHand = useAdminAction((guest) => checkinService.checkInGuest(guest.id), {
    role: 'checkin',
    error: false,
    key: (guest) => guest,
    invalidate: INVALIDATE,
    onSuccess: showOutcome,
    onError: showFailure,
  });

  const undo = useAdminAction((guest) => checkinService.undo(guest.id), {
    role: 'checkin',
    key: (guest) => guest,
    confirm: (guest) => ({ title: `Undo ${guest.name}'s check-in?`, confirmLabel: 'Undo check-in' }),
    success: (_res, guest) => `${guest.name} is no longer checked in`,
    invalidate: INVALIDATE,
  });

  // One guest at a time: hold the camera on the result, then look for the next.
  const onScan = async (decodedText) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setHeld(true);
    await scan.run(decodedText);
    timerRef.current = setTimeout(() => {
      busyRef.current = false;
      setHeld(false);
    }, NEXT_SCAN_MS);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return guests
      .filter((g) => g.name?.toLowerCase().includes(q) || g.unique_code?.toLowerCase() === q)
      .slice(0, 12);
  }, [guests, query]);

  const summaryCards = [
    { label: 'Expected', value: stats.total_expected, icon: Users, color: '#A67B5B' },
    { label: 'Checked In', value: stats.checked_in, icon: UserCheck, color: '#8B9A7D' },
    { label: 'Remaining', value: stats.remaining, icon: AlertCircle, color: '#B8936C' },
    { label: 'Progress', value: `${stats.percentage}%`, icon: CheckCircle, color: '#C8A68E' },
  ];

  return (
    <AdminPageLayout
      actions={[
        { id: 'refresh', readOnly: true, label: 'Refresh Stats', icon: RefreshCw, onClick: () => refetchStats() },
      ]}
      hero={(
        <AdminPageHero
          title="Guest Check-In"
          description={`Checked in: ${stats.checked_in} of ${stats.total_expected} expected${stats.awaiting_reply ? ` (${stats.confirmed} confirmed, ${stats.awaiting_reply} yet to reply)` : ''}`}
          breadcrumb="Check-In"
          icon={<QrCode className="w-5 h-5 text-[#A67B5B]" />}
        />
      )}
      summary={<AdminSummaryCards cards={summaryCards} columns={4} />}
    >
      <div className="grid md:grid-cols-2 gap-4">
        <AdminCard>
          <h3 className="text-lg font-medium text-stone-800 mb-1">Scan the guest&apos;s QR</h3>
          <p className="text-sm text-stone-500 mb-4">From their printed card or their Entry pass. The camera opens by itself and reads one guest after another.</p>

          <QrCamera onScan={onScan} paused={held} />

          <ResultPanel result={result} onClear={() => setResult(null)} />
        </AdminCard>

        <AdminCard>
          <h3 className="text-lg font-medium text-stone-800 mb-1">No code? Find them by name</h3>
          <p className="text-sm text-stone-500 mb-4">Type at least two letters of their name (or their invite code).</p>
          <label className="relative block">
            <span className="sr-only">Search guests</span>
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Achieng"
              className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#C4A385]"
            />
          </label>

          <ul className="mt-3 divide-y divide-stone-100">
            {query.trim().length >= 2 && matches.length === 0 && (
              <li className="py-6 text-center text-sm text-stone-500">No guest by that name.</li>
            )}
            {matches.map((g) => {
              const arrived = Boolean(g.checked_in_at);
              return (
                <li key={g.id} className="py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-800 truncate">{g.name}</p>
                    <p className="text-xs text-stone-500">
                      {[g.rsvp_status === 'confirmed' ? 'Attending' : g.rsvp_status === 'declined' ? 'Declined' : 'Awaiting reply', g.group].filter(Boolean).join(' · ')}
                      {arrived && ` · in at ${new Date(g.checked_in_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                    </p>
                  </div>
                  {arrived ? (
                    <Button size="sm" icon={Undo2} action={undo} args={[g]}>Undo</Button>
                  ) : (
                    <Button size="sm" variant="secondary" icon={UserCheck} action={checkInByHand} args={[g]}>Check in</Button>
                  )}
                </li>
              );
            })}
          </ul>
        </AdminCard>
      </div>
    </AdminPageLayout>
  );
}
