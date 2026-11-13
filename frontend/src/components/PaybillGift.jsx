import { useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Copy, Check, Send } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { giftService } from '../services/api';
import { QUICK_AMOUNTS, formatKes, newIdempotencyKey } from '../utils/mpesa';

const INPUT =
  'w-full py-3.5 px-4 rounded-xl border border-stone-200 text-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-palette-cinnamon/20 focus:border-palette-cinnamon';

function CopyRow({ label, value, copied, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
        <p className="text-lg font-semibold text-stone-800 tracking-wide break-all">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(label, value)}
        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-stone-600 hover:bg-stone-50"
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

/**
 * Pay Bill details as numbered steps, the way guests do it on their phone:
 * Lipa na M-Pesa → Pay Bill → business number → account number → amount + PIN.
 * Shows who the money goes to (e.g. the bride's bank account), so a bank's
 * shared Pay Bill number doesn't look unfamiliar.
 */
export function PaybillDetails({ paybill, account, payee, bank, compact = false }) {
  const [copied, setCopied] = useState(null);
  if (!paybill) return null;

  const copy = async (label, value) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable: the number is on screen anyway */
    }
  };

  const goesTo = [payee, bank].filter(Boolean).join(' · ');
  const step = 'flex gap-3';
  const num = 'w-6 h-6 shrink-0 mt-0.5 rounded-full bg-palette-cinnamon/10 text-palette-cinnamon text-xs font-bold flex items-center justify-center';

  return (
    <div className={`rounded-xl bg-stone-50 border border-stone-100 ${compact ? 'p-3' : 'p-4'} space-y-3`}>
      {goesTo && (
        <p className="text-sm text-stone-600">
          Goes to <span className="font-semibold text-stone-800">{goesTo}</span>
        </p>
      )}
      <ol className="space-y-3">
        <li className={step}>
          <span className={num}>1</span>
          <p className="text-stone-700">Open M-Pesa and choose <span className="font-medium">Lipa na M-Pesa → Pay Bill</span></p>
        </li>
        <li className={step}>
          <span className={num}>2</span>
          <div className="flex-1 min-w-0"><CopyRow label="Business number" value={paybill} copied={copied === 'Business number'} onCopy={copy} /></div>
        </li>
        {account && (
          <li className={step}>
            <span className={num}>3</span>
            <div className="flex-1 min-w-0"><CopyRow label="Account number" value={account} copied={copied === 'Account number'} onCopy={copy} /></div>
          </li>
        )}
        <li className={step}>
          <span className={num}>{account ? 4 : 3}</span>
          <p className="text-stone-700">Enter the amount and your M-Pesa PIN</p>
        </li>
      </ol>
    </div>
  );
}

const formatDay = (value) => (value ? new Date(value).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : '');

/** The gifts sent from this invitation. Only this guest (and the couple, in the admin) sees them. */
export function MyGifts({ gifts }) {
  if (!gifts?.length) return null;
  return (
    <div className="rounded-xl border border-green-100 bg-green-50/60 p-4 space-y-2">
      <p className="text-sm font-semibold text-green-800">Your gifts</p>
      <ul className="space-y-1.5">
        {gifts.map((g) => (
          <li key={g.id} className="flex items-center justify-between gap-3 text-stone-700">
            <span className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
              <span className="font-semibold">{formatKes(g.amount)}</span>
              {g.receipt && <span className="font-mono text-xs text-stone-500 truncate">{g.receipt}</span>}
            </span>
            <span className="text-xs text-stone-500 shrink-0">{formatDay(g.created_at)}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-stone-500">Only you and the couple can see this.</p>
    </div>
  );
}

/**
 * "I've sent my gift": after paying by Pay Bill, the guest records the amount
 * and M-Pesa code so the couple know who it came from.
 */
export function ReportGiftSheet({ open, onClose, guest, onRecorded }) {
  const [step, setStep] = useState('form'); // form | done
  const [amount, setAmount] = useState(1000);
  const [useOther, setUseOther] = useState(false);
  const [otherAmount, setOtherAmount] = useState('');
  const [receipt, setReceipt] = useState('');
  const [onBehalf, setOnBehalf] = useState(false);
  const [behalfName, setBehalfName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [recorded, setRecorded] = useState(null);
  const keyRef = useRef(null);

  const giftAmount = useOther ? Number(String(otherAmount).replace(/\D+/g, '')) : amount;
  const amountValid = Number.isFinite(giftAmount) && giftAmount >= 1;
  const giverName = onBehalf ? behalfName.trim() : (guest?.name || '').trim();
  const code = receipt.replace(/\s+/g, '').toUpperCase();

  const reset = () => {
    setStep('form'); setReceipt(''); setMessage(''); setError(''); setRecorded(null);
    setUseOther(false); setOtherAmount(''); setOnBehalf(false); setBehalfName('');
  };
  const close = () => { onClose(); if (step === 'done') reset(); };

  const submit = async () => {
    setError('');
    if (!amountValid) return setError('Please choose the amount you sent.');
    if (!/^[A-Z0-9]{8,12}$/.test(code)) return setError('Please type the M-Pesa code from your confirmation SMS, e.g. TKD4ABC12X.');
    if (!giverName) return setError(onBehalf ? 'Please type the name of the person the gift is from.' : 'Please tell us who the gift is from.');

    keyRef.current ||= newIdempotencyKey();
    setSending(true);
    try {
      const { data } = await giftService.mpesaReport({
        guest_code: guest?.unique_code,
        amount: giftAmount,
        receipt: code,
        giver_name: giverName,
        on_behalf: onBehalf,
        message: message.trim() || undefined,
        idempotency_key: keyRef.current,
      });
      keyRef.current = null;
      setRecorded(data);
      onRecorded?.(data);
      setStep('done');
    } catch (err) {
      if (err.response) keyRef.current = null;
      setError(err.response?.data?.message || "We couldn't reach the server. Please check your internet connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const firstName = (giverName || guest?.name || '').split(' ')[0];

  return (
    <Modal open={open} onClose={close} maxWidth="md" label="I've sent my gift">
      <div className="bg-white rounded-2xl p-6 space-y-5 text-left">
        {step === 'form' ? (
          <>
            <div>
              <h3 className="font-serif text-2xl text-stone-800">I've sent my gift</h3>
              <p className="text-stone-500 mt-1">Let the couple know it came from you. Only you and the couple will see this.</p>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-stone-700 mb-2">How much did you send?</legend>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_AMOUNTS.map((value) => {
                  const selected = !useOther && amount === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => { setUseOther(false); setAmount(value); setError(''); }}
                      className={`py-3.5 rounded-xl border text-lg font-semibold transition-colors ${
                        selected ? 'bg-palette-cinnamon text-white border-palette-cinnamon' : 'bg-white text-stone-700 border-stone-200 hover:border-palette-cinnamon/50'
                      }`}
                    >
                      {formatKes(value)}
                    </button>
                  );
                })}
              </div>
              {useOther ? (
                <label className="block mt-2">
                  <span className="sr-only">Other amount in KES</span>
                  <div className="flex items-center rounded-xl border border-palette-cinnamon px-3 focus-within:ring-2 focus-within:ring-palette-cinnamon/20">
                    <span className="text-stone-500 font-semibold">KES</span>
                    <input
                      id="report-gift-amount"
                      autoFocus
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={otherAmount}
                      onChange={(e) => { setOtherAmount(e.target.value.replace(/[^\d,]/g, '')); setError(''); }}
                      placeholder="Enter amount"
                      className="w-full py-3.5 px-2 text-lg font-semibold text-stone-800 outline-none bg-transparent"
                    />
                  </div>
                </label>
              ) : (
                <button
                  type="button"
                  onClick={() => { setUseOther(true); setError(''); }}
                  className="w-full mt-2 py-3 rounded-xl border border-dashed border-stone-300 text-stone-600 hover:border-palette-cinnamon/50"
                >
                  Other amount
                </button>
              )}
            </fieldset>

            <label className="block" htmlFor="report-gift-code">
              <span className="block text-sm font-semibold text-stone-700 mb-2">M-Pesa code</span>
              <input
                id="report-gift-code"
                value={receipt}
                onChange={(e) => { setReceipt(e.target.value.toUpperCase().slice(0, 14)); setError(''); }}
                placeholder="e.g. TKD4ABC12X"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className={`${INPUT} font-mono tracking-wider`}
              />
              <span className="block text-sm text-stone-500 mt-1.5">It's at the start of the confirmation SMS from M-PESA.</span>
            </label>

            <div>
              <p className="text-sm font-semibold text-stone-700 mb-2">This gift is from</p>
              {!onBehalf && guest?.name && <p className="rounded-xl bg-stone-50 px-4 py-3 text-lg text-stone-800">{guest.name}</p>}
              {onBehalf && (
                <input
                  id="report-gift-behalf"
                  autoFocus
                  value={behalfName}
                  onChange={(e) => { setBehalfName(e.target.value); setError(''); }}
                  placeholder="Their name, e.g. Grandma Achieng"
                  aria-label="Name of the person the gift is from"
                  className={INPUT}
                />
              )}
              <label className="flex items-center gap-3 mt-3 cursor-pointer select-none">
                <input
                  id="report-gift-onbehalf"
                  type="checkbox"
                  checked={onBehalf}
                  onChange={(e) => { setOnBehalf(e.target.checked); setError(''); }}
                  className="w-5 h-5 rounded accent-palette-cinnamon"
                />
                <span className="text-stone-700">I sent this for someone else</span>
              </label>
            </div>

            <textarea
              id="report-gift-message"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              rows={2}
              placeholder="A short message for the couple (optional)"
              aria-label="Message for the couple"
              className="w-full py-3 px-4 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-palette-cinnamon/20 focus:border-palette-cinnamon"
            />

            {error && (
              <p role="alert" className="flex items-start gap-2 text-red-700 bg-red-50 rounded-xl px-4 py-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> {error}
              </p>
            )}

            <Button variant="secondary" size="lg" fullWidth icon={Send} loading={sending} disabled={sending} onClick={submit}>
              Record my gift
            </Button>
          </>
        ) : (
          <div className="text-center space-y-4 py-2" aria-live="polite">
            <CheckCircle2 className="w-20 h-20 mx-auto text-green-600" />
            <h3 className="font-serif text-2xl text-stone-800">Thank you{firstName ? `, ${firstName}` : ''}!</h3>
            <p className="text-lg text-stone-600">
              Your gift of <strong>{formatKes(recorded?.amount ?? giftAmount)}</strong> is recorded for the couple.
            </p>
            {recorded?.receipt && (
              <p className="text-stone-500">M-Pesa code: <span className="font-mono font-semibold text-stone-700">{recorded.receipt}</span></p>
            )}
            <Button size="lg" fullWidth onClick={close}>Done</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
