import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import Overlay from '../Overlay';
import { registerConfirmHost } from '../../utils/feedback';

/** Renders the dialogs requested through confirmAction(). Mount once. */
export default function ConfirmHost() {
  const [request, setRequest] = useState(null); // { opts, resolve }
  const [typed, setTyped] = useState('');
  const confirmRef = useRef(null);

  useEffect(() => registerConfirmHost((opts, resolve) => {
    setTyped(opts.input?.defaultValue || '');
    setRequest({ opts, resolve });
  }), []);

  useEffect(() => {
    if (request && !request.opts.input && !request.opts.requireText) setTimeout(() => confirmRef.current?.focus(), 30);
  }, [request]);

  // Prompts resolve the typed text (or null); confirmations resolve true/false.
  const close = (accepted) => {
    const isPrompt = !!request?.opts.input;
    request?.resolve(isPrompt ? (accepted ? typed.trim() : null) : accepted);
    setRequest(null);
  };

  const opts = request?.opts;
  const danger = opts?.tone === 'danger';
  const blocked = (opts?.requireText && typed.trim() !== opts.requireText) || (opts?.input && !typed.trim());
  const Icon = danger ? AlertTriangle : HelpCircle;

  return (
    <AnimatePresence>
      {request && (
        <Overlay onClose={() => close(false)} zIndex={300}>
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={opts.message ? 'confirm-message' : undefined}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
          >
            <div className="flex gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-50 text-red-600' : 'bg-[#A67B5B]/10 text-[#A67B5B]'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="confirm-title" className="text-lg font-semibold text-stone-800">{opts.title}</h2>
                {opts.message && <p id="confirm-message" className="mt-1 text-sm text-stone-600 whitespace-pre-line">{opts.message}</p>}
                {opts.input && (
                  <form onSubmit={(e) => { e.preventDefault(); if (!blocked) close(true); }}>
                    <label className="block mt-4 text-sm text-stone-600">
                      {opts.input.label}
                      <input
                        autoFocus
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        placeholder={opts.input.placeholder}
                        list={opts.input.suggestions?.length ? 'confirm-suggestions' : undefined}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30"
                      />
                    </label>
                    {opts.input.suggestions?.length > 0 && (
                      <datalist id="confirm-suggestions">
                        {opts.input.suggestions.map((s) => <option key={s} value={s} />)}
                      </datalist>
                    )}
                  </form>
                )}
                {opts.requireText && (
                  <label className="block mt-4 text-sm text-stone-600">
                    Type <strong>{opts.requireText}</strong> to confirm
                    <input
                      autoFocus
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30"
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => close(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100">
                {opts.cancelLabel}
              </button>
              <button
                ref={confirmRef}
                type="button"
                disabled={blocked}
                onClick={() => close(true)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#A67B5B] hover:bg-[#8B5E3C]'}`}
              >
                {opts.confirmLabel}
              </button>
            </div>
          </motion.div>
        </Overlay>
      )}
    </AnimatePresence>
  );
}
