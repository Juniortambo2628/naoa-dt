import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { History, X, RotateCcw, Globe2 } from 'lucide-react';
import Overlay from '../Overlay';
import Button from '../Button';
import Spinner from './Spinner';
import SegmentedControl from '../SegmentedControl';
import { CollaboratorAvatar } from './CollaboratorAvatars';
import { collaborationService } from '../../services/api';
import { moduleByKey } from '../../utils/adminModules';
import { confirmAction, notifyError, notifySuccess } from '../../utils/feedback';

const ACTION_WORDS = { created: 'added', updated: 'edited', deleted: 'deleted', restored: 'restored' };

const dayLabel = (date) => (isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'EEEE, d MMM yyyy'));

/** Field names as people say them: "venue_address" -> "Venue address". */
const fieldLabel = (field) => field.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

function Change({ change }) {
  return (
    <li className="text-xs text-stone-600 break-words">
      <span className="font-medium text-stone-700">{fieldLabel(change.field)}: </span>
      {change.before !== null && <del className="text-stone-400 decoration-red-300">{change.before}</del>}
      {change.before !== null && ' → '}
      <span className="text-stone-800">{change.after ?? '—'}</span>
    </li>
  );
}

function Entry({ revision, batchSize, showModule, onRestore, restoring }) {
  const who = revision.user || { id: 0, name: 'A guest' };
  const when = new Date(revision.updated_at || revision.created_at);
  const moduleLabel = moduleByKey(revision.module)?.label || revision.module;
  return (
    <li className="flex gap-3 py-3">
      <CollaboratorAvatar person={who} size="sm" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm text-stone-700 leading-snug">
          <span className="font-medium text-stone-900">{who.name}</span> {ACTION_WORDS[revision.action] || revision.action}{' '}
          <span className="font-medium text-stone-900">{revision.subject_label || revision.subject_type}</span>
        </p>
        <p className="text-[11px] text-stone-500 flex flex-wrap gap-x-2">
          <span title={format(when, 'PPpp')}>{formatDistanceToNow(when, { addSuffix: true })}</span>
          {showModule && <span className="px-1.5 rounded bg-stone-100 text-stone-600">{moduleLabel}</span>}
        </p>
        {revision.changes?.length > 0 && (
          <ul className="space-y-0.5 pt-0.5">
            {revision.changes.slice(0, 4).map((change) => <Change key={change.field} change={change} />)}
            {revision.changes.length > 4 && <li className="text-[11px] text-stone-400">+{revision.changes.length - 4} more fields</li>}
          </ul>
        )}
        {revision.restorable && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Button size="sm" icon={RotateCcw} disabled={restoring} onClick={() => onRestore(revision, false)}>
              {revision.action === 'deleted' ? 'Restore deleted item' : 'Restore this version'}
            </Button>
            {batchSize > 1 && (
              <Button size="sm" disabled={restoring} onClick={() => onRestore(revision, true)}>
                Restore whole save ({batchSize})
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * Version history (opened from the header): every change to the current
 * page's data — or all pages — with who made it, and one-click restore.
 */
export default function VersionHistoryDrawer({ module, onClose, onRestored }) {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState(module ? 'page' : 'all');
  const [restoring, setRestoring] = useState(false);
  const filterModule = scope === 'page' ? module : null;
  const moduleLabel = moduleByKey(module)?.label;

  const query = useInfiniteQuery({
    queryKey: ['revisions', filterModule],
    queryFn: async ({ pageParam }) => (await collaborationService.getRevisions({ module: filterModule || undefined, page: pageParam })).data,
    initialPageParam: 1,
    getNextPageParam: (last) => (last && last.current_page < last.last_page ? last.current_page + 1 : undefined),
    staleTime: 0,
  });
  const revisions = query.data?.pages.flatMap((p) => p?.data || []) || [];
  const batchSizes = revisions.reduce((acc, r) => ({ ...acc, [r.batch]: (acc[r.batch] || 0) + 1 }), {});

  const restore = async (revision, wholeBatch) => {
    const ok = await confirmAction({
      title: wholeBatch ? 'Restore the whole save?' : 'Restore this version?',
      message: wholeBatch
        ? `Every change saved together with "${revision.subject_label}" goes back to how it was then. You can undo this from the history too.`
        : `"${revision.subject_label}" goes back to this version. Your current version stays in the history, so you can undo this.`,
      confirmLabel: 'Restore',
    });
    if (!ok) return;
    setRestoring(true);
    try {
      const res = await collaborationService.restoreRevision(revision.id, { batch: wholeBatch });
      notifySuccess(res.data?.restored > 1 ? `${res.data.restored} changes restored` : 'Version restored');
      await queryClient.invalidateQueries();
      onRestored?.();
    } catch (err) {
      notifyError(err, 'Could not restore this version');
    } finally {
      setRestoring(false);
    }
  };

  let lastDay = null;

  return (
    <Overlay onClose={onClose} className="flex justify-end" backdropClassName="bg-black/30" zIndex={90}>
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Version history"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
      >
        <div className="shrink-0 px-4 py-3 border-b border-stone-100 space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#A67B5B]" />
            <h2 className="text-lg font-medium text-stone-800 flex-1">Version history</h2>
            <button type="button" onClick={onClose} aria-label="Close version history" className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100">
              <X className="w-5 h-5" />
            </button>
          </div>
          {module && (
            <SegmentedControl
              size="sm"
              fullWidth
              aria-label="Show changes for"
              value={scope}
              onChange={setScope}
              options={[
                { value: 'page', label: moduleLabel || 'This page' },
                { value: 'all', label: 'All pages', icon: Globe2 },
              ]}
            />
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4">
          {query.isLoading ? (
            <div className="py-10 flex justify-center"><Spinner /></div>
          ) : query.isError ? (
            <p className="py-10 text-center text-sm text-stone-500">Couldn&apos;t load the history. Try again in a moment.</p>
          ) : revisions.length === 0 ? (
            <div className="py-12 text-center space-y-1">
              <History className="w-10 h-10 mx-auto text-stone-200" />
              <p className="text-sm text-stone-500">No changes recorded {scope === 'page' ? 'on this page ' : ''}yet.</p>
              <p className="text-xs text-stone-400">Every save from now on can be restored here.</p>
            </div>
          ) : (
            <ul>
              {revisions.map((revision) => {
                const day = dayLabel(new Date(revision.updated_at || revision.created_at));
                const header = day !== lastDay ? day : null;
                lastDay = day;
                return (
                  <li key={revision.id}>
                    {header && <h3 className="sticky top-0 z-10 bg-white/95 backdrop-blur pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-stone-500">{header}</h3>}
                    <ul className="divide-y divide-stone-100">
                      <Entry
                        revision={revision}
                        batchSize={batchSizes[revision.batch] || 1}
                        showModule={scope === 'all'}
                        onRestore={restore}
                        restoring={restoring}
                      />
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
          {query.hasNextPage && (
            <div className="py-4 flex justify-center">
              <Button size="sm" loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>Load older changes</Button>
            </div>
          )}
        </div>
      </motion.aside>
    </Overlay>
  );
}
