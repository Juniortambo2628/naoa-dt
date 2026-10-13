import { toast } from 'react-hot-toast';

/*
 * App-wide user feedback, usable from any handler without hooks:
 *   await confirmAction('Delete this guest?')         → styled dialog, resolves true/false
 *   notifyError(err, 'Failed to save')                → toast with the API message if any
 *   notifySuccess('Saved')
 *   notifyUndo('Guest deleted', () => restore())      → toast with an Undo button
 * <ConfirmHost/> (mounted once in AdminShell) renders the dialog.
 */

let showDialog = null;

/** Registered by ConfirmHost; returns an unregister function. */
export function registerConfirmHost(show) {
  showDialog = show;
  return () => { if (showDialog === show) showDialog = null; };
}

const DANGER = /\b(delete|remove|reset|disable|restore|merge|discard)\b/i;
const VERBS = ['Delete', 'Remove', 'Reset', 'Send', 'Resend', 'Import', 'Mark', 'Enable', 'Disable', 'Restore', 'Merge', 'Discard'];

/** Normalise a string or options object into dialog options. */
export function confirmOptions(input) {
  const opts = typeof input === 'string' ? { message: input } : { ...input };
  const text = `${opts.title || ''} ${opts.message || ''}`;
  const verb = VERBS.find((v) => new RegExp(`^\\s*(are you sure you want to\\s+)?${v}\\b`, 'i').test(opts.message || ''));
  return {
    title: opts.title || (opts.message && opts.message.length <= 70 ? opts.message : 'Are you sure?'),
    message: (opts.title || (opts.message && opts.message.length > 70)) ? opts.message : null,
    confirmLabel: opts.confirmLabel || verb || 'Confirm',
    cancelLabel: opts.cancelLabel || 'Cancel',
    tone: opts.tone || (DANGER.test(text) ? 'danger' : 'default'),
    requireText: opts.requireText || null,
    input: opts.input || null, // { label, defaultValue, placeholder, suggestions } — see promptAction
  };
}

/** Ask the user to confirm; falls back to window.confirm outside the admin shell. */
export function confirmAction(input) {
  const opts = confirmOptions(input);
  if (!showDialog) {
    return Promise.resolve(window.confirm([opts.title, opts.message].filter(Boolean).join('\n\n')));
  }
  return new Promise((resolve) => showDialog(opts, resolve));
}

/**
 * Ask for a short text value. Resolves the trimmed text, or null if cancelled.
 * @param {{ title, message?, label?, defaultValue?, placeholder?, suggestions?: string[], confirmLabel? }} opts
 */
export function promptAction({ label, defaultValue = '', placeholder, suggestions, ...opts }) {
  const options = confirmOptions({ confirmLabel: 'Save', tone: 'default', ...opts, input: { label, defaultValue, placeholder, suggestions } });
  if (!showDialog) {
    const value = window.prompt(options.title, defaultValue);
    return Promise.resolve(value === null ? null : value.trim());
  }
  return new Promise((resolve) => showDialog(options, resolve));
}

export function notifyError(errOrMessage, fallback = 'Something went wrong') {
  const message = typeof errOrMessage === 'string'
    ? errOrMessage
    : errOrMessage?.response?.data?.message || fallback;
  toast.error(message);
}

export function notifySuccess(message) {
  toast.success(message);
}

/** Success toast with an Undo button (shown for `duration` ms). */
export function notifyUndo(message, onUndo, duration = 7000) {
  toast((t) => (
    <span className="flex items-center gap-3">
      <span>{message}</span>
      <button
        type="button"
        onClick={async () => {
          toast.dismiss(t.id);
          try {
            await onUndo();
            toast.success('Undone');
          } catch (err) {
            notifyError(err, 'Could not undo');
          }
        }}
        className="px-2.5 py-1 rounded-lg bg-[#A67B5B] text-white text-xs font-semibold hover:bg-[#8B5E3C]"
      >
        Undo
      </button>
    </span>
  ), { duration });
}
