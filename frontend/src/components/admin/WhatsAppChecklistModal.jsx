import Overlay from '../Overlay';
import { useMemo, useState } from 'react';
import { X, FileText, MessageCircle, Search } from 'lucide-react';
import Button from '../Button';

const SENT_STATUSES = ['sent', 'opened', 'responded'];

const isInviteSent = (guest) => SENT_STATUSES.includes(guest.invitation?.status);

// Tracks WhatsApp invites sent one by one. Ticks are saved to the guest's
// invitation status, so progress is kept across sessions and devices.
export default function WhatsAppChecklistModal({ isOpen, onClose, guests, onDownloadPdf, onOpenChat, onToggleSent }) {
  const [hideSent, setHideSent] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('az'); // az | za | unsent
  const [busyId, setBusyId] = useState(null);
  const [pending, setPending] = useState({}); // optimistic ticks: guestId -> bool

  const withPhone = useMemo(() => guests.filter(g => g.phone), [guests]);
  const sentState = (g) => (g.id in pending ? pending[g.id] : isInviteSent(g));
  const sentCount = withPhone.filter(sentState).length;
  const q = query.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, '');
  const rows = withPhone
    .filter(g => !hideSent || !sentState(g))
    .filter(g => !q
      || g.name?.toLowerCase().includes(q)
      || g.unique_code?.toLowerCase().includes(q)
      || g.email?.toLowerCase().includes(q)
      || (qDigits.length >= 3 && String(g.phone).replace(/\D/g, '').includes(qDigits)))
    .sort((a, b) => {
      if (sortBy === 'unsent' && sentState(a) !== sentState(b)) return sentState(a) ? 1 : -1;
      const byName = (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
      return sortBy === 'za' ? -byName : byName;
    });

  if (!isOpen) return null;

  const toggle = async (guest) => {
    const next = !sentState(guest);
    setPending(p => ({ ...p, [guest.id]: next }));
    try {
      await onToggleSent(guest, next);
    } catch {
      setPending(p => ({ ...p, [guest.id]: !next }));
    }
  };

  const downloadPdf = async (guest) => {
    setBusyId(guest.id);
    try {
      await onDownloadPdf(guest);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Overlay onClose={onClose} className="flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:max-w-3xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-stone-100 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-stone-800">WhatsApp Checklist</h3>
            <p className="text-xs text-stone-500 mt-1">
              Open each chat (message and RSVP link are pre-filled), attach the guest's PDF, send, then tick it off.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-stone-100 shrink-0">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-3 bg-stone-50 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[160px]">
            <p className="text-sm font-medium text-stone-700">{sentCount} of {withPhone.length} sent</p>
            <div className="mt-1 h-2 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${withPhone.length ? (sentCount / withPhone.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="w-full flex flex-col sm:flex-row gap-2 order-last">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, phone or code…"
                aria-label="Search guests"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort guests"
              className="py-2 px-3 rounded-lg border border-stone-200 bg-white text-sm text-stone-700"
            >
              <option value="az">Name A–Z</option>
              <option value="za">Name Z–A</option>
              <option value="unsent">Not sent first</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
            <input type="checkbox" checked={hideSent} onChange={(e) => setHideSent(e.target.checked)} />
            Hide sent
          </label>
        </div>

        <ul className="overflow-y-auto divide-y divide-stone-100">
          {rows.length === 0 && (
            <li className="p-8 text-center text-sm text-stone-400">
              {withPhone.length === 0 ? 'No guests with phone numbers.' : q ? `No guests match "${query.trim()}".` : 'All done — every invite is ticked off.'}
            </li>
          )}
          {rows.map(guest => {
            const sent = sentState(guest);
            return (
              <li key={guest.id} className={`flex items-center gap-3 px-4 sm:px-6 py-3 ${sent ? 'bg-green-50/50' : ''}`}>
                <input
                  type="checkbox"
                  checked={sent}
                  onChange={() => toggle(guest)}
                  aria-label={`Mark ${guest.name} as sent`}
                  className="w-5 h-5 accent-green-600 shrink-0"
                />
                <div className={`flex-1 min-w-0 ${sent ? 'opacity-60' : ''}`}>
                  <p className="text-sm font-semibold text-stone-800 truncate">{guest.name}</p>
                  <p className="text-[11px] text-stone-500 font-mono truncate">{guest.phone} · {guest.unique_code}</p>
                </div>
                <Button
                  size="sm"
                  icon={FileText}
                  loading={busyId === guest.id}
                  onClick={() => downloadPdf(guest)}
                  disabled={busyId !== null}
                  className="shrink-0"
                  title="Download this guest's PDF"
                >
                  <span className="hidden sm:inline">PDF</span>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={MessageCircle}
                  onClick={() => onOpenChat(guest)}
                  className="shrink-0"
                  title="Open WhatsApp chat"
                >
                  <span className="hidden sm:inline">Chat</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </Overlay>
  );
}
