import { CloudCheck, AlertCircle } from 'lucide-react';
import Spinner from './Spinner';

const STATES = {
  saving: { className: 'bg-amber-50 text-amber-700', label: 'Saving…', short: 'Saving' },
  error: { className: 'bg-red-50 text-red-700', label: 'Save error', short: 'Error' },
  saved: { className: 'bg-green-50 text-green-700', label: 'Changes saved', short: 'Saved' },
};

/** Autosave indicator for the invitation designer (shown in the admin header). */
export default function InvitationSaveStatus({ status }) {
  const state = STATES[status] || STATES.saved;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 whitespace-nowrap ${state.className}`}
      title={state.label}
    >
      {status === 'saving' ? <Spinner size="sm" /> : status === 'error' ? <AlertCircle className="w-3.5 h-3.5" /> : <CloudCheck className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">{state.label}</span>
      <span className="sm:hidden">{state.short}</span>
    </div>
  );
}
