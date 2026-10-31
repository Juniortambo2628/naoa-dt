import { useState } from 'react';
import { BellRing, Send, Smartphone, Users, UserCheck, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminSummaryCards from '../../components/admin/AdminSummaryCards';
import AdminListPanel from '../../components/admin/AdminListPanel';
import AdminCard from '../../components/admin/AdminCard';
import { AdminInput, AdminTextarea, AdminSelect } from '../../components/admin/AdminInput';
import EmptyState from '../../components/admin/EmptyState';
import SegmentedControl from '../../components/SegmentedControl';
import Button from '../../components/Button';
import { usePushOverview } from '../../hooks/useApiHooks';
import { pushService } from '../../services/api';
import useAdminAction from '../../hooks/useAdminAction';
import usePolling from '../../hooks/usePolling';

// Pages a notification can open when tapped.
const LINKS = [
  { value: '', label: 'Homepage' },
  { value: '/programme', label: 'Event programme' },
  { value: '/gallery', label: 'Gallery' },
  { value: '/gifts', label: 'Gift registry' },
  { value: '/songs', label: 'Song requests' },
  { value: '/faq', label: 'FAQs' },
];

const STATUS = {
  queued: { text: 'Sending…', className: 'bg-amber-50 text-amber-700' },
  sent: { text: 'Sent', className: 'bg-emerald-50 text-emerald-700' },
  failed: { text: 'Failed', className: 'bg-red-50 text-red-700' },
};

const EMPTY = { title: '', body: '', url: '', audience: 'all' };

export default function AdminAnnouncements() {
  const { data, isLoading, refetch } = usePushOverview();
  const stats = data?.stats || { devices: 0, guests: 0, confirmed_devices: 0 };
  const broadcasts = data?.broadcasts || [];
  const [form, setForm] = useState(EMPTY);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e?.target ? e.target.value : e }));

  // Sends go out from the queue within about a minute; keep the status fresh.
  usePolling(refetch, broadcasts.some((b) => b.status === 'queued') ? 10000 : 60000);

  const recipients = form.audience === 'confirmed' ? stats.confirmed_devices : stats.devices;

  const send = useAdminAction(() => pushService.send({ ...form, url: form.url || null }), {
    key: () => 'send',
    confirm: () => ({
      title: 'Send this announcement?',
      message: `“${form.title}” will be pushed to ${recipients} device(s). This can’t be undone.`,
      confirmLabel: 'Send',
    }),
    success: (res) => res.data?.recipients ? `Sending to ${res.data.recipients} device(s)` : 'Saved — no devices have notifications on yet',
    error: 'Could not send the announcement',
    onSuccess: () => { setForm(EMPTY); refetch(); },
  });

  const canSend = form.title.trim() && form.body.trim() && !send.pending;

  return (
    <AdminPageLayout
      hero={
        <AdminPageHero
          title="Announcements"
          description="Push a short notification to guests who turned on updates from their invitation."
          breadcrumb="Announcements"
          icon={<BellRing className="w-5 h-5 text-[#A67B5B]" />}
        />
      }
      summary={
        <AdminSummaryCards
          columns={3}
          cards={[
            { label: 'Devices subscribed', value: stats.devices, icon: Smartphone, color: '#A67B5B', hint: 'Phones and browsers with updates on' },
            { label: 'Guests reached', value: stats.guests, icon: Users, color: '#7D8FA6', hint: 'Linked to an invitation' },
            { label: 'Confirmed guests’ devices', value: stats.confirmed_devices, icon: UserCheck, color: '#6B8E5A', hint: 'RSVP’d yes' },
          ]}
        />
      }
      actions={[
        { id: 'refresh', readOnly: true, label: 'Refresh', icon: RefreshCw, onClick: () => refetch(), disabled: isLoading },
      ]}
    >
      <AdminCard>
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); if (canSend) send.run(); }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput label="Title" value={form.title} onChange={set('title')} maxLength={100} placeholder="Shuttle leaves at 1pm" required />
            <AdminSelect label="Opens when tapped" value={form.url} onChange={set('url')}>
              {LINKS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </AdminSelect>
          </div>
          <AdminTextarea label="Message" value={form.body} onChange={set('body')} maxLength={500} rows={3} placeholder="The shuttle from the hotel leaves at 1pm sharp — see you there!" required />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <SegmentedControl
              size="sm"
              aria-label="Who receives it"
              value={form.audience}
              onChange={set('audience')}
              options={[
                { value: 'all', label: 'All subscribed guests' },
                { value: 'confirmed', label: 'Confirmed guests only' },
              ]}
            />
            <Button type="submit" variant="secondary" icon={Send} edit loading={send.pending} disabled={!canSend}>
              Send to {recipients} device{recipients === 1 ? '' : 's'}
            </Button>
          </div>
          {data && !data.available && (
            <p className="text-sm text-red-600">Push notifications aren’t available on the server yet (keys could not be created).</p>
          )}
        </form>
      </AdminCard>

      <AdminListPanel>
        {isLoading ? (
          <EmptyState loading />
        ) : broadcasts.length === 0 ? (
          <EmptyState icon={BellRing} message="No announcements sent yet" />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Announcement</th>
                <th className="px-4 py-3 font-semibold">Audience</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {broadcasts.map((b) => {
                const status = STATUS[b.status] || STATUS.queued;
                return (
                  <tr key={b.id}>
                    <td className="px-6 py-3">
                      <div className="font-medium text-stone-800">{b.title}</div>
                      <div className="text-xs text-stone-500 line-clamp-2">{b.body}</div>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{b.audience === 'confirmed' ? 'Confirmed guests' : 'Everyone'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.className}`}>{status.text}</span>
                      {b.status !== 'queued' && (
                        <div className="text-xs text-stone-500 mt-1">{b.sent_count} delivered{b.failed_count ? ` · ${b.failed_count} failed` : ''}</div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-stone-600">
                      <div>{formatDistanceToNow(new Date(b.sent_at || b.created_at), { addSuffix: true })}</div>
                      {b.user?.name && <div className="text-xs text-stone-500">by {b.user.name}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </AdminListPanel>
    </AdminPageLayout>
  );
}
