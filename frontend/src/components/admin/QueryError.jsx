import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../Button';

/**
 * Shown when data failed to load — never fall back to made-up numbers.
 * @param {string}   [what]    - What failed to load, e.g. "guest statistics"
 * @param {function} onRetry
 * @param {Error}    [error]
 */
export default function QueryError({ what = 'this data', onRetry, error }) {
  const detail = error?.response?.data?.message || error?.message;
  return (
    <div role="alert" className="p-6 rounded-2xl bg-red-50 border border-red-100 flex flex-col sm:flex-row sm:items-center gap-4">
      <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-semibold text-red-800">Couldn&rsquo;t load {what}</p>
        <p className="text-sm text-red-700">
          The numbers below may be missing until it loads.{detail ? ` (${detail})` : ''}
        </p>
      </div>
      {onRetry && (
        <Button variant="danger" icon={RefreshCw} onClick={onRetry}>Retry</Button>
      )}
    </div>
  );
}
