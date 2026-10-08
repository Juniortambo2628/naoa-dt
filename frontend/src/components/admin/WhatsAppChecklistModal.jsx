import { useMemo, useState } from 'react';
import { X, FileText, MessageCircle, Loader2 } from 'lucide-react';

const SENT_STATUSES = ['sent', 'opened', 'responded'];

const isInviteSent = (guest) => SENT_STATUSES.includes(guest.invitation?.status);

// Tracks WhatsApp invites sent one by one. Ticks are saved to the guest's
// invitation status, so progress is kept across sessions and devices.
export default function WhatsAppChecklistModal({ isOpen, onClose, guests, onDownloadPdf, onOpenChat, onToggleSent }) {
  const [hideSent, setHideSent] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [pending, setPending] = useState({}); // optimistic ticks: guestId -> bool

  const withPhone = useMemo(() => guests.filter(g => g.phone), [guests]);
  const sentState = (g) => (g.id in pending ? pending[g.id] : isInviteSent(g));
  const sentCount = withPhone.filter(sentState).length;
  const rows = hideSent ? withPhone.filter(g => !sentState(g)) : withPhone;

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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
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
          <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
            <input type="checkbox" checked={hideSent} onChange={(e) => setHideSent(e.target.checked)} />
            Hide sent
          </label>
        </div>

        <ul className="overflow-y-auto divide-y divide-stone-100">
          {rows.length === 0 && (
            <li className="p-8 text-center text-sm text-stone-400">
              {withPhone.length === 0 ? 'No guests with phone numbers.' : 'All done — every invite is ticked off.'}
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
                <button
                  onClick={() => downloadPdf(guest)}
                  disabled={busyId !== null}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 text-xs text-stone-700 hover:bg-stone-50 disabled:opacity-50 shrink-0"
                  title="Download this guest's PDF"
                >
                  {busyId === guest.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button
                  onClick={() => onOpenChat(guest)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 text-white text-xs hover:bg-green-600 shrink-0"
                  title="Open WhatsApp chat"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
