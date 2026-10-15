import { useState } from 'react';
import { DatabaseBackup, Download, RotateCcw, Trash2, Plus, Images, ShieldCheck, Clock } from 'lucide-react';
import { saveAs } from 'file-saver';
import { formatDistanceToNow } from 'date-fns';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminSummaryCards from '../../components/admin/AdminSummaryCards';
import AdminListPanel from '../../components/admin/AdminListPanel';
import EmptyState from '../../components/admin/EmptyState';
import Button from '../../components/Button';
import { useBackups } from '../../hooks/useApiHooks';
import { backupService } from '../../services/api';
import { notifyError, notifySuccess } from '../../utils/feedback';
import useAdminAction from '../../hooks/useAdminAction';

const LABELS = {
  manual: { text: 'Manual', className: 'bg-[#A67B5B]/10 text-[#8B5E3C]' },
  scheduled: { text: 'Nightly', className: 'bg-sky-50 text-sky-700' },
  'pre-restore': { text: 'Before restore', className: 'bg-amber-50 text-amber-700' },
  'pre-merge': { text: 'Before merge', className: 'bg-amber-50 text-amber-700' },
  'pre-import': { text: 'Before import', className: 'bg-amber-50 text-amber-700' },
};

const formatSize = (bytes) => (!bytes ? '0 KB' : bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export default function AdminBackups() {
  const { data: backups = [], isLoading, refetch } = useBackups();
  const [downloading, setDownloading] = useState(null);
  // Owner-only operations; each refreshes the list afterwards (also on failure).
  const ownerOp = { role: 'owner', error: 'Backup action failed', onSuccess: () => refetch(), onError: () => refetch() };

  const createBackup = useAdminAction((includeUploads) => backupService.create(includeUploads), {
    ...ownerOp,
    key: () => 'create',
    success: (_, includeUploads) => (includeUploads ? 'Backup with photos created' : 'Backup created'),
  });
  const create = createBackup.run;

  // Test-restores the backup into a throwaway database; the real data is untouched.
  const verifyBackup = useAdminAction(async (backup) => (await backupService.verify(backup.name)).data, {
    ...ownerOp,
    key: (backup) => `verify:${backup.name}`,
    onSuccess: (result) => {
      const records = result.tables.reduce((sum, t) => sum + t.restored, 0);
      if (result.ok) {
        notifySuccess(`Backup verified: ${result.tables.length} tables and ${records} records restore correctly.`);
      } else {
        const bad = result.tables.filter((t) => !t.ok).map((t) => `${t.table} (${t.restored}/${t.expected})`);
        notifyError(`Backup verification failed — incomplete tables: ${bad.join(', ')}`);
      }
      refetch();
    },
  });
  const verify = verifyBackup.run;

  // Reading a backup isn't a change, so it doesn't need the action helper.
  const download = async (backup) => {
    setDownloading(backup.name);
    try {
      const res = await backupService.download(backup.name);
      saveAs(res.data, backup.name);
    } catch (err) {
      notifyError(err, 'Download failed');
    }
    setDownloading(null);
  };

  const restoreBackup = useAdminAction((backup) => backupService.restore(backup.name), {
    ...ownerOp,
    key: (backup) => backup.name,
    confirm: (backup) => ({
      title: 'Restore this backup?',
      message: `All guests, RSVPs, settings and other data will be replaced with the copy from ${new Date(backup.created_at).toLocaleString()}. A safety backup of the current data is taken first, so this can be undone.`,
      confirmLabel: 'Restore',
      tone: 'danger',
      requireText: 'RESTORE',
    }),
    success: (res) => `Restored ${res.data?.restored_rows ?? 0} records. Reloading…`,
    onSuccess: () => setTimeout(() => window.location.reload(), 1200),
  });
  const restore = restoreBackup.run;

  const deleteBackup = useAdminAction((backup) => backupService.delete(backup.name), {
    ...ownerOp,
    key: (backup) => backup.name,
    confirm: (backup) => `Delete backup ${backup.name}?`,
    success: 'Backup deleted',
  });
  const remove = deleteBackup.run;

  // One backup operation at a time.
  const busy = createBackup.pending ? 'create'
    : [verifyBackup, restoreBackup, deleteBackup].some((op) => op.pending) || downloading ? 'row' : null;
  const isWorking = (backup) => downloading === backup.name || restoreBackup.isPending(backup.name)
    || deleteBackup.isPending(backup.name) || verifyBackup.isPending(`verify:${backup.name}`);

  const latest = backups[0];
  const nightly = backups.find((b) => b.label === 'scheduled');
  const totalSize = backups.reduce((sum, b) => sum + (b.size || 0), 0);

  return (
    <AdminPageLayout
      fill
      hero={
        <AdminPageHero
          title="Backups"
          description="Snapshots of your wedding data. A backup is also taken nightly and before every restore, merge or import."
          breadcrumb={[{ label: 'Dashboard', path: '/admin/dashboard' }, { label: 'Settings', path: '/admin/dashboard/settings' }, { label: 'Backups' }]}
          icon={<DatabaseBackup className="w-5 h-5 text-[#A67B5B]" />}
        />
      }
      summary={
        <AdminSummaryCards
          columns={3}
          cards={[
            {
              label: 'Latest backup',
              value: latest ? formatDistanceToNow(new Date(latest.created_at), { addSuffix: true }) : 'None yet',
              icon: ShieldCheck,
              color: latest ? '#6B8E5A' : '#C0756B',
              hint: latest ? `${latest.rows} records` : 'Create one now',
            },
            {
              label: 'Last nightly backup',
              value: nightly ? formatDistanceToNow(new Date(nightly.created_at), { addSuffix: true }) : 'Not run yet',
              icon: Clock,
              color: '#7D8FA6',
              hint: nightly ? 'Keeps the last 14' : 'Needs the server cron job',
            },
            { label: 'Stored backups', value: backups.length, icon: DatabaseBackup, color: '#A67B5B', hint: formatSize(totalSize) },
          ]}
        />
      }
      actions={[
        { id: 'create', label: busy === 'create' ? 'Backing up…' : 'Back Up Now', icon: Plus, variant: 'secondary', onClick: () => create(false), disabled: !!busy },
        { id: 'create-uploads', label: 'Back Up incl. Photos', icon: Images, onClick: () => create(true), disabled: !!busy },
      ]}
    >
      <AdminListPanel>
        {isLoading ? (
          <EmptyState loading />
        ) : backups.length === 0 ? (
          <EmptyState icon={DatabaseBackup} message="No backups yet" action={{ label: 'Back up now', onClick: () => create(false) }} />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Contents</th>
                <th className="px-4 py-3 font-semibold">Size</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {backups.map((backup) => {
                const label = LABELS[backup.label] || { text: backup.label || 'Backup', className: 'bg-stone-100 text-stone-600' };
                const working = isWorking(backup);
                return (
                  <tr key={backup.name} className={working ? 'opacity-60' : ''}>
                    <td className="px-6 py-3">
                      <div className="font-medium text-stone-800">{new Date(backup.created_at).toLocaleString()}</div>
                      <div className="text-xs text-stone-500">{formatDistanceToNow(new Date(backup.created_at), { addSuffix: true })}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${label.className}`}>{label.text}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {backup.rows} records in {backup.tables} tables{backup.includes_uploads ? ' + photos' : ''}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{formatSize(backup.size)}</td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon-sm" icon={ShieldCheck} onClick={() => verify(backup)} disabled={!!busy} loading={verifyBackup.isPending(`verify:${backup.name}`)} aria-label={`Verify ${backup.name}`} title="Verify it restores (safe test)" />
                        <Button size="icon-sm" icon={Download} onClick={() => download(backup)} disabled={!!busy} aria-label={`Download ${backup.name}`} title="Download" />
                        <Button size="icon-sm" icon={RotateCcw} onClick={() => restore(backup)} disabled={!!busy} aria-label={`Restore ${backup.name}`} title="Restore" />
                        <Button size="icon-sm" variant="danger" icon={Trash2} onClick={() => remove(backup)} disabled={!!busy} aria-label={`Delete ${backup.name}`} title="Delete" />
                      </div>
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
