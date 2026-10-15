import { useCallback, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import useRole from './useRole';
import { useCollaboration } from '../context/CollaborationContext';
import { confirmAction, notifyError, notifySuccess } from '../utils/feedback';

const resolve = (value, ...args) => (typeof value === 'function' ? value(...args) : value);

/** A 403 from EnforceRole already showed its own toast (see services/api.js). */
const deniedByRole = (err) => err?.response?.status === 403 && err.response.data?.reason === 'role';

/**
 * useAdminAction — the one way admin pages change data.
 *
 * Wraps a write (usually a service call) with everything every save needs,
 * so pages only say *what* to save:
 *   - role: view-only collaborators can't run it, and controls using it hide
 *   - optional confirm dialog
 *   - pending state (overall, or per item via `key`)
 *   - success / error feedback
 *   - refreshing cached data, the version history and the sidebar badges
 *
 *   const remove = useAdminAction((id) => faqService.delete(id), {
 *     confirm: 'Delete this FAQ?',
 *     success: 'FAQ deleted',
 *     invalidate: [['faqs']],
 *   });
 *   <Button action={remove} args={[faq.id]} icon={Trash2}>Delete</Button>
 *   // or: remove.run(faq.id)
 *
 * Because Button / toolbar / bulk actions know an action is an edit, they
 * hide it from viewers on their own — no per-page role code.
 *
 * @param {(...args) => Promise} fn  The write.
 * @param {object} [options]
 * @param {string|object|(...args) => string|object|null} [options.confirm]  confirmAction input; null/'' skips
 * @param {string|(result, ...args) => string} [options.success]  Toast on success (none if omitted)
 * @param {string|false|(err, ...args) => string} [options.error='Something went wrong']  Fallback error message
 *   (false: no toast — the page shows the error itself, e.g. via onError)
 * @param {Array<Array>} [options.invalidate]  React Query keys to refetch afterwards
 * @param {(result, ...args) => void} [options.onSuccess]
 * @param {(err, ...args) => void} [options.onError]
 * @param {(...args) => any} [options.key]  Per-item pending key (default: the first argument)
 * @param {boolean} [options.rethrow]  Re-throw errors to the caller (e.g. to keep a form open)
 * @param {'editor'|'owner'} [options.role='editor']  Who may run it: editors and owners, or owners only
 */
export default function useAdminAction(fn, options = {}) {
  const { canEdit, isOwner } = useRole();
  const allowed = options.role === 'owner' ? isOwner : canEdit;
  const queryClient = useQueryClient();
  const { refresh: refreshCollaboration } = useCollaboration();
  const [pendingKeys, setPendingKeys] = useState(() => new Set());
  // Latest fn/options without re-creating `run` (pages pass inline lambdas).
  const latest = useRef({ fn, options });
  latest.current = { fn, options };

  const run = useCallback(async (...args) => {
    const { fn: write, options: opts } = latest.current;
    if (!allowed) {
      toast.error(opts.role === 'owner' ? 'Only owners can do this.' : 'You have view-only access.', { id: 'role-denied' });
      return undefined;
    }

    const confirmInput = resolve(opts.confirm, ...args);
    if (confirmInput && !await confirmAction(confirmInput)) return undefined;

    const key = opts.key ? opts.key(...args) : args[0];
    setPendingKeys((keys) => new Set(keys).add(key));
    try {
      const result = await write(...args);
      const message = resolve(opts.success, result, ...args);
      if (message) notifySuccess(message);
      await Promise.all([
        ...(opts.invalidate || []).map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        queryClient.invalidateQueries({ queryKey: ['revisions'] }),
      ]);
      refreshCollaboration?.();
      opts.onSuccess?.(result, ...args);
      return result;
    } catch (err) {
      if (opts.error !== false && !deniedByRole(err)) notifyError(err, resolve(opts.error, err, ...args) || 'Something went wrong');
      opts.onError?.(err, ...args);
      if (opts.rethrow) throw err;
      return undefined;
    } finally {
      setPendingKeys((keys) => {
        const next = new Set(keys);
        next.delete(key);
        return next;
      });
    }
  }, [allowed, queryClient, refreshCollaboration]);

  return useMemo(() => ({
    run,
    allowed,
    pending: pendingKeys.size > 0,
    isPending: (key) => pendingKeys.has(key),
    isAdminAction: true,
  }), [run, allowed, pendingKeys]);
}

/**
 * useBulkAdminAction — useAdminAction for "do this to every selected item".
 * `fn(id)` runs for each id; when some fail, the rest still apply and the
 * error says how many failed. `run(ids)`; messages may use the ids array:
 *
 *   const bulkDelete = useBulkAdminAction((id) => giftService.delete(id), {
 *     confirm: (ids) => `Delete ${ids.length} selected gifts?`,
 *     success: (count) => `${count} gifts deleted`,
 *     invalidate: [['gifts']],
 *   });
 */
export function useBulkAdminAction(fn, options = {}) {
  return useAdminAction(async (ids) => {
    const results = await Promise.allSettled(ids.map((id) => fn(id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed) {
      const err = new Error(`${failed} of ${ids.length} failed`);
      err.failed = failed;
      throw err;
    }
    return ids.length;
  }, {
    key: () => 'bulk',
    error: (err, ids) => (err.failed ? `${err.failed} of ${ids.length} couldn't be updated` : 'Something went wrong'),
    ...options,
  });
}
