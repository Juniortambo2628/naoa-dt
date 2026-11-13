import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Gift, Smartphone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { giftService } from '../services/api';
import { PaybillDetails, MyGifts, ReportGiftSheet } from './PaybillGift';
import useMyGifts from '../hooks/useMyGifts';
import {
  QUICK_AMOUNTS, normalizeKenyanPhone, formatKenyanPhone, formatKes, newIdempotencyKey,
} from '../utils/mpesa';

const POLL_MS = 3000;
const HELP_AFTER_MS = 40 * 1000;     // offer "didn't get it?" help
const GIVE_UP_MS = 4 * 60 * 1000;    // stop polling; the server keeps checking
const MIN_AMOUNT = 10;

const DEFAULT_NOTE = 'Your presence is our greatest gift. If you would like to give a cash gift, you can send it with M-Pesa — a payment request comes straight to your phone.';
const PAYBILL_NOTE = 'Your presence is our greatest gift. If you would like to give a cash gift, you can send it from your M-Pesa menu with the details below.';

/**
 * "Send a cash gift" card on the digital invitation, with a step-by-step
 * sheet: pick an amount -> confirm the phone -> "Check your phone" ->
 * thank you. Name and phone come from the invite; the gift can be sent on
 * behalf of someone else. Falls back to Paybill details when the M-Pesa
 * prompt is not available.
 */
export default function CashGiftCard({ guest, settings }) {
  const stkEnabled = Boolean(settings?.mpesa_stk_enabled);
  const paybill = settings?.mpesa_paybill_number || '';
  const account = settings?.mpesa_paybill_account || guest?.unique_code || '';
  const payee = settings?.mpesa_paybill_name || '';
  const bank = settings?.mpesa_paybill_bank || '';
  const note = settings?.cash_gift_note || (stkEnabled ? DEFAULT_NOTE : PAYBILL_NOTE);
  const [myGifts, setMyGifts] = useMyGifts(guest?.unique_code);
  const [reportOpen, setReportOpen] = useState(false);

  const guestPhone = normalizeKenyanPhone(guest?.phone);
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('form'); // form | waiting | success | failed | unknown
  const [amount, setAmount] = useState(1000);
  const [otherAmount, setOtherAmount] = useState('');
  const [useOther, setUseOther] = useState(false);
  const [phone, setPhone] = useState(guestPhone ? formatKenyanPhone(guestPhone) : '');
  const [editingPhone, setEditingPhone] = useState(!guestPhone);
  const [onBehalf, setOnBehalf] = useState(false);
  const [behalfName, setBehalfName] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [payment, setPayment] = useState(null);
  const [waitingSince, setWaitingSince] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const keyRef = useRef(null);

  const giftAmount = useOther ? Number(String(otherAmount).replace(/\D+/g, '')) : amount;
  const amountValid = Number.isFinite(giftAmount) && giftAmount >= MIN_AMOUNT;
  const giverName = onBehalf ? behalfName.trim() : (guest?.name || '').trim();

  // "Send a gift" from the quick actions (or a notification) opens the sheet.
  // (keyed on each navigation, so tapping it again reopens a closed sheet)
  useEffect(() => {
    if (location.hash === '#cash-gift' && stkEnabled) setOpen(true);
  }, [location.key, location.hash, stkEnabled]);

  // While waiting, poll for the outcome until it is known.
  useEffect(() => {
    if (step !== 'waiting' || !payment?.id || !open) return undefined;
    let cancelled = false;

    const tick = async () => {
      if (Date.now() - waitingSince > HELP_AFTER_MS) setShowHelp(true);
      if (Date.now() - waitingSince > GIVE_UP_MS) {
        setStep('unknown');
        return;
      }
      try {
        const { data } = await giftService.mpesaStatus(payment.id);
        if (cancelled) return;
        setPayment(data);
        if (data.status === 'success') setStep('success');
        else if (data.status !== 'pending') setStep('failed');
      } catch {
        /* a dropped connection: keep trying */
      }
    };

    const timer = setInterval(tick, POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, [step, payment?.id, open, waitingSince]);

  if (!stkEnabled && !paybill) return null;

  const startWaiting = (p) => {
    setPayment(p);
    setWaitingSince(Date.now());
    setShowHelp(false);
    setStep('waiting');
  };

  const send = async () => {
    setError('');
    const normalizedPhone = normalizeKenyanPhone(phone);
    if (!amountValid) return setError(`Please choose an amount of at least ${formatKes(MIN_AMOUNT)}.`);
    if (!normalizedPhone) {
      setEditingPhone(true);
      return setError('Please enter a Safaricom number like 0712 345 678.');
    }
    if (!giverName) return setError(onBehalf ? 'Please type the name of the person the gift is from.' : 'Please tell us who the gift is from.');

    keyRef.current ||= newIdempotencyKey();
    setSending(true);
    try {
      const { data } = await giftService.mpesaSend({
        amount: giftAmount,
        phone: normalizedPhone,
        giver_name: giverName,
        on_behalf: onBehalf,
        guest_code: guest?.unique_code,
        message: message.trim() || undefined,
        idempotency_key: keyRef.current,
      });
      keyRef.current = null; // the next tap of "Send" is a new request
      startWaiting(data);
    } catch (err) {
      const body = err.response?.data;
      // Keep the key if the server never answered: retrying then reuses it,
      // so a request that did get through can't send a second prompt.
      if (err.response) keyRef.current = null;
      if (err.response?.status === 409 && body?.errors?.payment) {
        startWaiting(body.errors.payment); // a request is already on that phone
      } else if (err.response?.status === 502 && body?.errors?.payment) {
        setPayment({ ...body.errors.payment, message: body.message });
        setStep('failed');
      } else if (err.response?.status === 503) {
        setPayment({ status: 'failed', message: body?.message || 'M-Pesa gifts are not available right now.' });
        setStep('failed');
      } else {
        setError(body?.message || "We couldn't reach the server. Please check your internet connection and try again.");
      }
    } finally {
      setSending(false);
    }
  };

  const tryAgain = () => {
    setPayment(null);
    setError('');
    setStep('form');
  };

  const close = () => {
    setOpen(false);
    // Start fresh next time once this gift is finished.
    if (step === 'success' || step === 'failed' || step === 'unknown') tryAgain();
  };

  const firstName = (giverName || guest?.name || '').split(' ')[0];

  return (
    <section id="cash-gift" className="scroll-mt-24" aria-labelledby="cash-gift-title">
      <div className="bg-white p-6 rounded-2xl border border-palette-light-brown/40 shadow-sm space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 bg-palette-cinnamon/10 text-palette-cinnamon rounded-xl flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 id="cash-gift-title" className="font-serif text-xl text-stone-800">Send a cash gift</h3>
            <p className="text-stone-500 leading-relaxed mt-1">{note}</p>
          </div>
        </div>

        {stkEnabled ? (
          <Button variant="secondary" size="lg" fullWidth icon={Smartphone} onClick={() => setOpen(true)}>
            Send a gift with M-Pesa
          </Button>
        ) : (
          <>
            <PaybillDetails paybill={paybill} account={account} payee={payee} bank={bank} />
            {/* Optional: only for guests who'd like the couple to know the gift is from them. */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
              <p className="text-sm text-stone-500">Already sent it? You can let the couple know it's from you. This is optional.</p>
              <Button variant="primary" size="md" icon={CheckCircle2} onClick={() => setReportOpen(true)} className="shrink-0">
                I've sent my gift
              </Button>
            </div>
          </>
        )}

        <MyGifts gifts={myGifts} />
      </div>

      <ReportGiftSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        guest={guest}
        onRecorded={(gift) => setMyGifts((list) => [gift, ...list.filter((g) => g.id !== gift.id)])}
      />

      <Modal open={open} onClose={close} maxWidth="md" label="Send a cash gift">
        <div className="bg-white rounded-2xl p-6 space-y-5 text-left">
          {step === 'form' && (
            <>
              <div>
                <h3 className="font-serif text-2xl text-stone-800">Send a cash gift</h3>
                <p className="text-stone-500 mt-1">With M-Pesa — you'll confirm with your PIN.</p>
              </div>

              <fieldset>
                <legend className="text-sm font-semibold text-stone-700 mb-2">How much?</legend>
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

              <div>
                <p className="text-sm font-semibold text-stone-700 mb-2">M-Pesa number</p>
                {editingPhone ? (
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(''); }}
                    placeholder="0712 345 678"
                    aria-label="M-Pesa phone number"
                    className="w-full py-3.5 px-4 rounded-xl border border-stone-200 text-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-palette-cinnamon/20 focus:border-palette-cinnamon"
                  />
                ) : (
                  <div className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3">
                    <span className="text-lg text-stone-800">{phone}</span>
                    <button type="button" onClick={() => setEditingPhone(true)} className="text-sm font-medium text-palette-cinnamon">
                      Use another number
                    </button>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-700 mb-2">This gift is from</p>
                {!onBehalf && guest?.name && (
                  <p className="rounded-xl bg-stone-50 px-4 py-3 text-lg text-stone-800">{guest.name}</p>
                )}
                {onBehalf && (
                  <input
                    autoFocus
                    value={behalfName}
                    onChange={(e) => { setBehalfName(e.target.value); setError(''); }}
                    placeholder="Their name, e.g. Grandma Achieng"
                    aria-label="Name of the person the gift is from"
                    className="w-full py-3.5 px-4 rounded-xl border border-stone-200 text-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-palette-cinnamon/20 focus:border-palette-cinnamon"
                  />
                )}
                <label className="flex items-center gap-3 mt-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onBehalf}
                    onChange={(e) => { setOnBehalf(e.target.checked); setError(''); }}
                    className="w-5 h-5 rounded accent-palette-cinnamon"
                  />
                  <span className="text-stone-700">I'm sending this for someone else</span>
                </label>
              </div>

              {showMessage ? (
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="A short message for the couple (optional)"
                  aria-label="Message for the couple"
                  className="w-full py-3 px-4 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-palette-cinnamon/20 focus:border-palette-cinnamon"
                />
              ) : (
                <button type="button" onClick={() => setShowMessage(true)} className="text-sm font-medium text-palette-cinnamon">
                  + Add a message (optional)
                </button>
              )}

              {error && (
                <p role="alert" className="flex items-start gap-2 text-red-700 bg-red-50 rounded-xl px-4 py-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> {error}
                </p>
              )}

              <Button variant="secondary" size="lg" fullWidth icon={Smartphone} loading={sending} disabled={sending || !amountValid} onClick={send}>
                {amountValid ? `Send ${formatKes(giftAmount)}` : 'Choose an amount'}
              </Button>

              {paybill && (
                <details className="text-stone-600">
                  <summary className="cursor-pointer text-sm">Prefer to use Pay Bill yourself?</summary>
                  <div className="mt-3"><PaybillDetails paybill={paybill} account={account} payee={payee} bank={bank} compact /></div>
                </details>
              )}
            </>
          )}

          {step === 'waiting' && (
            <div className="text-center space-y-4 py-2" aria-live="polite">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-50 text-green-600 flex items-center justify-center animate-pulse">
                <Smartphone className="w-10 h-10" />
              </div>
              <h3 className="font-serif text-2xl text-stone-800">Check your phone now</h3>
              <p className="text-lg text-stone-600 leading-relaxed">
                M-Pesa has sent a request for <strong>{formatKes(payment?.amount ?? giftAmount)}</strong> to{' '}
                <strong>{formatKenyanPhone(phone)}</strong>. Enter your <strong>M-Pesa PIN</strong> to send your gift.
              </p>
              <p className="flex items-center justify-center gap-2 text-stone-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Waiting for M-Pesa to confirm…
              </p>
              <p className="text-sm text-stone-400">You can close this page — your gift will still be recorded.</p>

              {showHelp && (
                <div className="text-left space-y-3 pt-2 border-t border-stone-100">
                  <p className="font-semibold text-stone-700">Didn't get the request?</p>
                  <p className="text-stone-600 text-sm">Make sure your phone is on and unlocked, then send it again.</p>
                  <Button variant="secondary" fullWidth onClick={tryAgain}>Send the request again</Button>
                  <PaybillDetails paybill={paybill} account={account} payee={payee} bank={bank} compact />
                </div>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4 py-2" aria-live="polite">
              <CheckCircle2 className="w-20 h-20 mx-auto text-green-600" />
              <h3 className="font-serif text-2xl text-stone-800">Thank you{firstName ? `, ${firstName}` : ''}!</h3>
              <p className="text-lg text-stone-600">
                Your gift of <strong>{formatKes(payment?.amount ?? giftAmount)}</strong> has been received.
              </p>
              {payment?.receipt && (
                <p className="text-stone-500">M-Pesa receipt: <span className="font-mono font-semibold text-stone-700">{payment.receipt}</span></p>
              )}
              <Button size="lg" fullWidth onClick={close}>Done</Button>
            </div>
          )}

          {step === 'failed' && (
            <div className="text-center space-y-4 py-2" aria-live="polite">
              <AlertCircle className="w-16 h-16 mx-auto text-amber-500" />
              <h3 className="font-serif text-2xl text-stone-800">The gift was not sent</h3>
              <p className="text-lg text-stone-600">{payment?.message || 'The payment did not go through. No money was taken.'}</p>
              <Button variant="secondary" size="lg" fullWidth onClick={tryAgain}>Try again</Button>
              <div className="text-left"><PaybillDetails paybill={paybill} account={account} payee={payee} bank={bank} compact /></div>
            </div>
          )}

          {step === 'unknown' && (
            <div className="text-center space-y-4 py-2" aria-live="polite">
              <Loader2 className="w-14 h-14 mx-auto text-stone-400" />
              <h3 className="font-serif text-2xl text-stone-800">Still confirming</h3>
              <p className="text-lg text-stone-600">
                M-Pesa is taking longer than usual. If money left your account, your gift will be recorded automatically — there's no need to send it again.
              </p>
              <Button size="lg" fullWidth onClick={close}>Done</Button>
            </div>
          )}
        </div>
      </Modal>
    </section>
  );
}
