import { Link } from 'react-router-dom';
import { Smartphone, CheckCircle2, AlertTriangle, FlaskConical, Settings } from 'lucide-react';
import { useMpesaPayments } from '../../hooks/useApiHooks';
import EmptyState from './EmptyState';
import { formatKes } from '../../utils/mpesa';

/** Where the M-Pesa connection and Pay Bill details are set up. */
const MPESA_SETTINGS_PATH = '/admin/dashboard/settings?section=mpesa';

const SetupLink = ({ children = 'Settings → M-Pesa Gifts' }) => (
  <Link to={MPESA_SETTINGS_PATH} className="font-medium underline underline-offset-2">{children}</Link>
);

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
          M-Pesa prompts are not connected yet: add the Safaricom (Daraja) details in <SetupLink />.
          Until then, guests see the Pay Bill details you fill in there.
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
        Live: guests {data.enabled ? 'can send gifts straight from their invitation.' : <>will see the prompt once you switch it on in <SetupLink />.</>}
      </p>
    </div>
  );
}

/**
 * Admin → Gifts → "M-Pesa gifts": connection status, totals and every gift
 * attempt with its receipt. The connection and the Pay Bill details guests see
 * are set up in Settings → M-Pesa Gifts.
 */
export default function MpesaGiftsPanel() {
  const { data, isLoading } = useMpesaPayments();
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

      <Link
        to={MPESA_SETTINGS_PATH}
        className="flex items-center gap-2 text-sm text-[#A67B5B] hover:underline w-fit"
      >
        <Settings className="w-4 h-4" /> M-Pesa connection and Pay Bill details
      </Link>

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
