import { RefreshCw } from 'lucide-react';

/**
 * RefreshButton — consistent refresh icon button for admin pages.
 * Spins when loading.
 *
 * @param {function} onClick  - Click handler
 * @param {boolean}  loading  - Whether to show the spinning animation
 * @param {string}   [title]  - Tooltip text
 */
export default function RefreshButton({ onClick, loading, title = 'Refresh' }) {
  return (
    <button 
      onClick={onClick}
      className="p-2 text-stone-500 hover:bg-stone-100 rounded-full transition-colors"
      title={title}
    >
      <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
    </button>
  );
}
