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
import { confirmAction, notifyError, notifySuccess } from '../../utils/feedback';

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
  const [busy, setBusy] = useState(null); // name of the backup being worked on, or 'create'

  const run = async (key, action) => {
    setBusy(key);
    try {
      await action();
    } catch (err) {
      notifyError(err, 'Backup action failed');
    } finally {
      setBusy(null);
      refetch();
    }
  };

  const create = (includeUploads) => run('create', async () => {
    await backupService.create(includeUploads);
    notifySuccess(includeUploads ? 'Backup with photos created' : 'Backup created');
  });

  // Test-restores the backup into a throwaway database; the real data is untouched.
  const verify = (backup) => run(`verify:${backup.name}`, async () => {
    const { data: result } = await backupService.verify(backup.name);
    const records = result.tables.reduce((sum, t) => sum + t.restored, 0);
    if (result.ok) {
      notifySuccess(`Backup verified: ${result.tables.length} tables and ${records} records restore correctly.`);
    } else {
      const bad = result.tables.filter((t) => !t.ok).map((t) => `${t.table} (${t.restored}/${t.expected})`);
      notifyError(`Backup verification failed — incomplete tables: ${bad.join(', ')}`);
    }
  });

  const download = (backup) => run(backup.name, async () => {
    const res = await backupService.download(backup.name);
    saveAs(res.data, backup.name);
  });

  const restore = async (backup) => {
    const ok = await confirmAction({
      title: 'Restore this backup?',
      message: `All guests, RSVPs, settings and other data will be replaced with the copy from ${new Date(backup.created_at).toLocaleString()}. A safety backup of the current data is taken first, so this can be undone.`,
      confirmLabel: 'Restore',
      tone: 'danger',
      requireText: 'RESTORE',
    });
    if (!ok) return;
    run(backup.name, async () => {
      const res = await backupService.restore(backup.name);
      notifySuccess(`Restored ${res.data?.restored_rows ?? 0} records. Reloading…`);
      setTimeout(() => window.location.reload(), 1200);
    });
  };

  const remove = async (backup) => {
    if (!await confirmAction(`Delete backup ${backup.name}?`)) return;
    run(backup.name, async () => {
      await backupService.delete(backup.name);
      notifySuccess('Backup deleted');
    });
  };

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
                const working = busy === backup.name;
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
                        <Button size="icon-sm" icon={ShieldCheck} onClick={() => verify(backup)} disabled={!!busy} loading={busy === `verify:${backup.name}`} aria-label={`Verify ${backup.name}`} title="Verify it restores (safe test)" />
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
