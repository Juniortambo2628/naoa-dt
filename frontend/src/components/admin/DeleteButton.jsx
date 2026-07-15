import { Trash2 } from 'lucide-react';
import Spinner from './Spinner';

/**
 * DeleteButton — consistent delete icon button for admin pages.
 * Shows a spinner when the item is being processed.
 *
 * @param {function} onClick    - Click handler
 * @param {boolean}  processing - Whether this item is currently being processed
 * @param {string}   [title]    - Tooltip text
 */
export default function DeleteButton({ onClick, processing, title = 'Delete' }) {
  return (
    <button
      onClick={onClick}
      disabled={processing}
      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      title={title}
    >
      {processing ? <Spinner size="sm" /> : <Trash2 className="w-5 h-5" />}
    </button>
  );
}
