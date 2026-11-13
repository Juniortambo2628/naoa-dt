import { useEffect, useMemo, useRef, useState } from 'react';
import {
  QrCode, UserCheck, Users, AlertCircle, CheckCircle, RefreshCw, Search, Undo2, Armchair, AlertTriangle, ScanLine, RotateCcw,
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
import { feedback, unlockSound } from '../../utils/haptics';

const INVALIDATE = [['checkinStats'], ['guests']];
/** How long an error or a welcome stays up before the camera looks again. */
const NEXT_SCAN_MS = 2500;
const AFTER_CHECK_IN_MS = 1500;

const firstName = (name = '') => name.split(' ')[0] || name;
const arrivedAt = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/**
 * What the scan found. "found": the guest, with a Check in button. "already":
 * they're in, with Undo. "ok": just checked in. "error": no match.
 */
function ResultPanel({ result, checkIn, undo, onNext }) {
  if (!result) return null;
  const { kind, message, guest } = result;
  const tone = {
    found: 'bg-[#FBF7F1] border-[#C4A385] text-stone-800',
    ok: 'bg-green-50 border-green-200 text-green-800',
    already: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-700',
  }[kind];
  const Icon = kind === 'ok' ? CheckCircle : kind === 'found' ? UserCheck : kind === 'already' ? AlertTriangle : AlertCircle;
  const declined = guest?.rsvp_status === 'declined';
  const awaiting = guest && !declined && guest.rsvp_status !== 'confirmed';

  return (
    <div role="status" aria-live="assertive" className={`mt-4 p-4 rounded-2xl border-2 ${tone}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-8 h-8 shrink-0" />
        <div className="min-w-0 flex-1">
          {kind === 'found' && <p className="text-xs uppercase tracking-[0.18em] text-[#8B7B6B]">Guest found</p>}
          <p className="font-semibold text-xl leading-tight">{message}</p>
          {guest && (
            <div className="mt-2 space-y-1 text-sm text-stone-700">
              <p className="flex items-center gap-1.5 font-medium">
                <Armchair className="w-4 h-4 text-[#A67B5B]" />
                {guest.table?.name ? tableLabel(guest.table.name) : 'No table assigned'}
              </p>
              {guest.guest_of && <p>Guest of {guest.guest_of}</p>}
              {guest.dietary_notes && <p>Note: {guest.dietary_notes}</p>}
              {awaiting && kind === 'found' && <p className="text-stone-600">Hadn&apos;t replied to the RSVP. They&apos;re on the list, so welcome them in.</p>}
              {declined && <p className="font-medium text-amber-700">RSVP: declined. Check with the coordinator before seating them.</p>}
              {kind === 'already' && guest.checked_in_at && <p>Checked in at {arrivedAt(guest.checked_in_at)}.</p>}
            </div>
          )}
        </div>
      </div>

      {kind === 'found' && (
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <Button variant="secondary" size="lg" icon={UserCheck} action={checkIn} args={[guest]} className="w-full">
            Check in {firstName(guest.name)}
          </Button>
          <Button size="lg" onClick={onNext}>Not now</Button>
        </div>
      )}
      {kind === 'already' && (
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <Button variant="secondary" size="lg" icon={ScanLine} onClick={onNext} className="w-full">Scan next guest</Button>
          <Button size="lg" icon={Undo2} action={undo} args={[guest]}>Undo</Button>
        </div>
      )}
      {kind === 'error' && (
        <div className="mt-3">
          <Button size="sm" icon={ScanLine} onClick={onNext}>Scan again</Button>
        </div>
      )}
    </div>
  );
}

/**
 * Check-in at the door. Every guest's QR (on their printed card and their
 * digital invitation) holds their invitation link. Scanning it shows who the
 * guest is; the usher then taps Check in. Guests without a code are found by
 * name and checked in by hand.
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

  // Back to scanning: clear the result and let the camera read again.
  const scanNext = () => {
    clearTimeout(timerRef.current);
    busyRef.current = false;
    setHeld(false);
    setResult(null);
  };
  const scanNextSoon = (ms) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(scanNext, ms);
  };

  const showFailure = (err) => {
    const data = err?.response?.data || {};
    const guest = data.errors?.guest;
    feedback(guest ? 'warning' : 'error');
    setResult({
      kind: guest ? 'already' : 'error',
      message: guest ? `${guest.name} is already checked in` : (data.message || 'Check-in failed. Try again, or find the guest by name.'),
      guest,
    });
  };

  const checkIn = useAdminAction((guest) => checkinService.checkInGuest(guest.id), {
    role: 'checkin',
    error: false,
    key: (guest) => guest,
    invalidate: INVALIDATE,
    onSuccess: (res) => {
      feedback('success');
      setResult({ kind: 'ok', message: `Welcome, ${res.data?.guest?.name || 'guest'}!`, guest: res.data?.guest });
      // A scanned guest: look for the next one shortly.
      if (busyRef.current) scanNextSoon(AFTER_CHECK_IN_MS);
    },
    onError: showFailure,
  });

  const undo = useAdminAction((guest) => checkinService.undo(guest.id), {
    role: 'checkin',
    key: (guest) => guest,
    confirm: (guest) => ({ title: `Undo ${guest.name}'s check-in?`, confirmLabel: 'Undo check-in' }),
    success: (_res, guest) => `${guest.name} is no longer checked in`,
    invalidate: INVALIDATE,
    onSuccess: () => { if (busyRef.current) scanNext(); },
  });

  const resetAll = useAdminAction(() => checkinService.resetAll(), {
    role: 'owner',
    key: () => 'reset',
    confirm: () => ({
      title: 'Clear every check-in?',
      message: 'Everyone goes back to not checked in. Use this after testing, not on the day.',
      confirmLabel: 'Clear all check-ins',
      tone: 'danger',
    }),
    success: (res) => `${res.data?.cleared ?? 0} check-ins cleared`,
    invalidate: INVALIDATE,
    onSuccess: scanNext,
  });

  // One guest at a time: hold the camera on who was found until the usher acts.
  const onScan = async (decodedText) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setHeld(true);
    try {
      const res = await checkinService.getGuestByCode(decodedText);
      const guest = res.data?.guest;
      if (guest?.checked_in_at) {
        feedback('warning');
        setResult({ kind: 'already', message: `${guest.name} is already checked in`, guest });
      } else {
        feedback('found');
        setResult({ kind: 'found', message: guest?.name || 'Guest', guest });
      }
    } catch (err) {
      feedback('error');
      setResult({ kind: 'error', message: err?.response?.data?.message || 'Couldn\'t read that code. Try again, or find the guest by name.' });
      scanNextSoon(NEXT_SCAN_MS);
    }
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // iPhones only play sound after a tap, so the first tap anywhere turns it on.
  useEffect(() => {
    document.addEventListener('pointerdown', unlockSound, { once: true });
    return () => document.removeEventListener('pointerdown', unlockSound);
  }, []);

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
        { id: 'reset', label: 'Clear all check-ins', icon: RotateCcw, variant: 'danger', action: resetAll },
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

          <ResultPanel result={result} checkIn={checkIn} undo={undo} onNext={scanNext} />
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
                    <Button size="sm" variant="secondary" icon={UserCheck} action={checkIn} args={[g]}>Check in</Button>
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
