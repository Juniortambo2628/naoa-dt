import { useEffect, useState } from 'react';
import { KeyRound, PlugZap, Save, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useMpesaSettings } from '../../hooks/useApiHooks';
import { giftService } from '../../services/api';
import useAdminAction from '../../hooks/useAdminAction';
import useRole from '../../hooks/useRole';
import { AdminInput } from './AdminInput';
import Button from '../Button';

const EMPTY = {
  env: 'sandbox',
  shortcode: '',
  transaction_type: 'CustomerPayBillOnline',
  till_number: '',
  consumer_key: '',
  consumer_secret: '',
  passkey: '',
  callback_base_url: '',
};

const INVALIDATE = [['gifts', 'mpesa-settings'], ['gifts', 'mpesa-payments'], ['settings', 'public']];

const errorMessage = (err, fallback) => err?.response?.data?.message || fallback;

function Choice({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${value === o.value ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A key field: write-only; says when one is already saved. */
function SecretInput({ label, saved, value, onChange, hint, error }) {
  return (
    <div>
      <AdminInput
        label={label}
        type="password"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={onChange}
        placeholder={saved ? 'Saved — leave blank to keep it' : 'Paste it here'}
        error={error}
      />
      <p className="mt-1 text-xs text-stone-500 flex items-center gap-1">
        {saved && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
        {saved ? 'Saved securely. ' : ''}{hint}
      </p>
    </div>
  );
}

/**
 * Owner-only card: paste the Safaricom Daraja details here instead of editing
 * the server. Keys are stored encrypted and never shown again.
 */
export default function MpesaConnectCard() {
  const { isOwner } = useRole();
  const { data: info } = useMpesaSettings(isOwner);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!info) return;
    setForm((f) => ({
      ...f,
      env: info.env || 'sandbox',
      shortcode: info.shortcode || '',
      transaction_type: info.transaction_type || 'CustomerPayBillOnline',
      till_number: info.till_number || '',
      callback_base_url: info.callback_base_url || '',
      consumer_key: '',
      consumer_secret: '',
      passkey: '',
    }));
  }, [info]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));
  const fieldError = (key) => errors[key]?.[0];

  const save = useAdminAction(() => giftService.saveMpesaSettings(form), {
    role: 'owner',
    key: () => 'save',
    success: 'M-Pesa details saved. Now press "Check connection".',
    error: (err) => errorMessage(err, 'Could not save the M-Pesa details'),
    invalidate: INVALIDATE,
    onSuccess: () => setErrors({}),
    onError: (err) => setErrors(err?.response?.data?.errors || {}),
  });

  const check = useAdminAction(() => giftService.testMpesaConnection(), {
    role: 'owner',
    key: () => 'check',
    success: () => (form.env === 'production'
      ? 'Connected to Safaricom (live). Guests can now get the M-Pesa prompt.'
      : 'Connected to the Safaricom sandbox (test mode, no real money moves).'),
    error: (err) => errorMessage(err, 'Could not reach Safaricom'),
    invalidate: INVALIDATE,
  });

  const remove = useAdminAction(() => giftService.removeMpesaSettings(), {
    role: 'owner',
    key: () => 'remove',
    confirm: { title: 'Remove the M-Pesa keys?', message: 'Guests will see the Pay Bill details instead of the phone prompt.', confirmLabel: 'Remove', tone: 'danger' },
    success: 'M-Pesa keys removed',
    invalidate: INVALIDATE,
  });

  if (!isOwner) {
    return (
      <section className="rounded-2xl border border-stone-100 bg-white p-5 text-sm text-stone-600 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-[#A67B5B] shrink-0" />
        Only an owner can connect M-Pesa (the Safaricom keys are kept private).
      </section>
    );
  }

  const isTill = form.transaction_type === 'CustomerBuyGoodsOnline';

  return (
    <section className="rounded-2xl border border-stone-100 bg-white p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-[#A67B5B]" />
          <h3 className="font-semibold text-stone-800">Connect M-Pesa</h3>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${!info?.configured ? 'bg-amber-50 text-amber-700' : info.env === 'production' ? 'bg-green-50 text-green-700' : 'bg-sky-50 text-sky-700'}`}>
          {!info?.configured ? 'Not connected' : info.env === 'production' ? 'Live' : 'Test mode'}
        </span>
      </div>

      <ol className="text-sm text-stone-600 space-y-1 list-decimal pl-5">
        <li>Open your app on <span className="font-medium">developer.safaricom.co.ke</span> (My Apps).</li>
        <li>Copy the details below into this form and press <span className="font-medium">Save</span>.</li>
        <li>Press <span className="font-medium">Check connection</span>. When it says connected, guests get the M-Pesa prompt.</li>
      </ol>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-stone-600">Mode</p>
          <Choice
            value={form.env}
            onChange={set('env')}
            options={[{ value: 'sandbox', label: 'Test (sandbox)' }, { value: 'production', label: 'Live (real money)' }]}
          />
          <p className="text-xs text-stone-500">Use Live only after Safaricom has approved your app (&ldquo;Go Live&rdquo;).</p>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-stone-600">Money is received on a</p>
          <Choice
            value={form.transaction_type}
            onChange={set('transaction_type')}
            options={[{ value: 'CustomerPayBillOnline', label: 'Pay Bill' }, { value: 'CustomerBuyGoodsOnline', label: 'Till (Buy Goods)' }]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdminInput
            label={isTill ? 'Store / head office number (short code)' : 'Pay Bill number (short code)'}
            inputMode="numeric"
            value={form.shortcode}
            onChange={set('shortcode')}
            placeholder={form.env === 'sandbox' ? 'e.g. 174379 for testing' : 'e.g. 4123456'}
            error={fieldError('shortcode')}
          />
          {isTill && (
            <AdminInput
              label="Till number"
              inputMode="numeric"
              value={form.till_number}
              onChange={set('till_number')}
              error={fieldError('till_number')}
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SecretInput label="Consumer Key" saved={info?.has_consumer_key} value={form.consumer_key} onChange={set('consumer_key')} hint="From your app on Daraja." error={fieldError('consumer_key')} />
          <SecretInput label="Consumer Secret" saved={info?.has_consumer_secret} value={form.consumer_secret} onChange={set('consumer_secret')} hint="From your app on Daraja." error={fieldError('consumer_secret')} />
        </div>
        <SecretInput
          label="Lipa Na M-Pesa Online passkey"
          saved={info?.has_passkey}
          value={form.passkey}
          onChange={set('passkey')}
          hint={form.env === 'sandbox' ? 'For testing, it is on the Daraja "M-Pesa Express" simulator page.' : 'Safaricom emails it after Go Live.'}
          error={fieldError('passkey')}
        />

        <details className="rounded-xl bg-stone-50 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-stone-600">Advanced (usually leave as is)</summary>
          <div className="mt-3">
            <AdminInput
              label="Public API address Safaricom reports payments to"
              value={form.callback_base_url}
              onChange={set('callback_base_url')}
              placeholder={info?.default_callback_base_url || 'https://…'}
              error={fieldError('callback_base_url')}
            />
            <p className="mt-1 text-xs text-stone-500">Blank uses {info?.default_callback_base_url || 'the server address'}.</p>
          </div>
        </details>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" icon={Save} action={save} args={['save']}>Save</Button>
        <Button icon={PlugZap} action={check} args={['check']} disabled={!info?.configured}>Check connection</Button>
        {info?.source === 'dashboard' && (
          <Button variant="danger" icon={Trash2} action={remove} args={['remove']}>Remove keys</Button>
        )}
      </div>
      <p className="text-xs text-stone-500">
        Keys are stored encrypted on the server and are never shown again, even to you.
        {info?.source === 'server' && ' (M-Pesa is currently connected from the server settings; saving here replaces them.)'}
      </p>
    </section>
  );
}
