import { useEffect, useState } from 'react';
import { Smartphone, CheckCircle2, AlertTriangle, FlaskConical, Save } from 'lucide-react';
import { useMpesaPayments, useSettings, useUpdateSettings } from '../../hooks/useApiHooks';
import { AdminInput, AdminTextarea } from './AdminInput';
import ToggleButton from './ToggleButton';
import Button from '../Button';
import EmptyState from './EmptyState';
import useAdminAction from '../../hooks/useAdminAction';
import { formatKes } from '../../utils/mpesa';

const STATUS_STYLES = {
  success: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-stone-100 text-stone-600',
  timeout: 'bg-stone-100 text-stone-600',
  failed: 'bg-red-50 text-red-700',
};

const STATUS_LABELS = {
  success: 'Received',
  pending: 'Waiting for PIN',
  cancelled: 'Cancelled',
  timeout: 'No response',
  failed: 'Failed',
};

const formatWhen = (value) => (value ? new Date(value).toLocaleString('en-KE', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
}) : '');

/** Whether the server can send prompts, in words an admin can act on. */
function ConnectionBanner({ data }) {
  if (!data) return null;
  if (!data.configured) {
    return (
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-sm">
          M-Pesa prompts are not connected yet: the Safaricom (Daraja) keys still need to be added to the server.
          Until then, guests see the Pay Bill details below, if you fill them in.
        </p>
      </div>
    );
  }
  if (data.environment !== 'production') {
    return (
      <div className="flex gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sky-800">
        <FlaskConical className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-sm">Test mode (Safaricom sandbox): prompts work, but no real money moves.</p>
      </div>
    );
  }
  return (
    <div className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="text-sm">
        Live: guests {data.enabled ? 'can send gifts straight from their invitation.' : 'will see the prompt once you switch it on below.'}
      </p>
    </div>
  );
}

/**
 * Admin → Gifts → "M-Pesa gifts": connection status, the switch and Pay Bill
 * details guests see, and every gift attempt with its receipt.
 */
export default function MpesaGiftsPanel() {
  const { data, isLoading } = useMpesaPayments();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const [form, setForm] = useState({ enabled: true, paybill: '', account: '', note: '' });

  useEffect(() => {
    if (!settings) return;
    setForm({
      enabled: !['false', '0', 'off', 'no'].includes(String(settings.mpesa_enabled ?? 'true').toLowerCase()),
      paybill: settings.mpesa_paybill_number || '',
      account: settings.mpesa_paybill_account || '',
      note: settings.cash_gift_note || '',
    });
  }, [settings]);

  const save = useAdminAction(() => updateSettings.mutateAsync({
    mpesa_enabled: String(form.enabled),
    mpesa_paybill_number: form.paybill.trim(),
    mpesa_paybill_account: form.account.trim(),
    cash_gift_note: form.note.trim(),
  }), {
    key: () => 'save',
    success: 'Cash gift settings saved',
    error: 'Could not save the cash gift settings',
  });

  const payments = data?.payments || [];
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <ConnectionBanner data={data} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-stone-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-stone-500">Received</p>
          <p className="text-2xl font-semibold text-stone-800">{formatKes(summary?.received_total ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-stone-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-stone-500">Gifts</p>
          <p className="text-2xl font-semibold text-stone-800">{summary?.received_count ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-stone-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-stone-500">Waiting for PIN</p>
          <p className="text-2xl font-semibold text-stone-800">{summary?.pending_count ?? 0}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-stone-100 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#A67B5B]" />
          <h3 className="font-semibold text-stone-800">What guests see</h3>
        </div>
        <ToggleButton
          enabled={form.enabled}
          onToggle={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
          label="Let guests send a gift with an M-Pesa prompt to their phone"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdminInput
            label="Pay Bill business number"
            value={form.paybill}
            onChange={(e) => setForm((f) => ({ ...f, paybill: e.target.value }))}
            placeholder="e.g. 123456"
            inputMode="numeric"
          />
          <AdminInput
            label="Account number to show"
            value={form.account}
            onChange={(e) => setForm((f) => ({ ...f, account: e.target.value }))}
            placeholder="Blank = each guest's invite code"
          />
        </div>
        <AdminTextarea
          label="Note on the invitation (optional)"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          rows={2}
          placeholder="Your presence is our greatest gift. If you would like to give a cash gift…"
        />
        <p className="text-xs text-stone-500">
          The Pay Bill details are shown to guests who prefer to pay from their M-Pesa menu, and whenever the prompt is unavailable.
        </p>
        <Button icon={Save} action={save} args={['save']}>Save</Button>
      </section>

      <section className="rounded-2xl border border-stone-100 bg-white overflow-hidden">
        <h3 className="px-5 py-4 font-semibold text-stone-800 border-b border-stone-100">Gift attempts</h3>
        {isLoading ? (
          <EmptyState loading />
        ) : payments.length === 0 ? (
          <EmptyState icon={Smartphone} message="No M-Pesa gifts yet" />
        ) : (
          <ul className="divide-y divide-stone-100">
            {payments.map((p) => (
              <li key={p.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-stone-800 truncate">
                    {p.giver_name}
                    {p.on_behalf && <span className="ml-2 text-xs font-normal text-stone-500">(on behalf)</span>}
                  </p>
                  <p className="text-xs text-stone-500 truncate">
                    {p.invite ? `Invite: ${p.invite.name} (${p.invite.code})` : 'No invite'} · {formatWhen(p.created_at)}
                    {p.receipt && <> · <span className="font-mono">{p.receipt}</span></>}
                  </p>
                  {p.message && <p className="text-xs italic text-stone-500 mt-0.5 line-clamp-2">&ldquo;{p.message}&rdquo;</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-stone-800">{formatKes(p.amount)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.status] || STATUS_STYLES.failed}`}>
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
