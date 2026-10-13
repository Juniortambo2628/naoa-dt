import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../Button';

/** Page numbers to show: first, last and a window around the current page. */
// eslint-disable-next-line react-refresh/only-export-components
export function pageWindow(current, total, radius = 1) {
  const pages = new Set([1, total]);
  for (let p = current - radius; p <= current + radius; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
}

/**
 * AdminPagination — footer for paginated admin lists (pair with
 * AdminListPanel's `footer` so it stays visible while rows scroll).
 *
 * @param {number}   currentPage
 * @param {number}   pageSize
 * @param {number}   totalItems
 * @param {function} onPageChange      - (page) => void
 * @param {number[]} [pageSizeOptions] - Show a rows-per-page picker
 * @param {function} [onPageSizeChange] - (size) => void
 */
export default function AdminPagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5">
      <div className="flex items-center gap-3 text-sm text-stone-600">
        <span>
          <span className="font-medium">{from}</span>–<span className="font-medium">{to}</span> of{' '}
          <span className="font-medium">{totalItems}</span>
        </span>
        {pageSizeOptions && onPageSizeChange && (
          <label className="hidden sm:flex items-center gap-2 text-stone-400">
            Rows
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20"
            >
              {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <Button
            size="icon-sm"
            icon={ChevronLeft}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          />
          {pageWindow(currentPage, totalPages).map((p) => (
            typeof p === 'string' ? (
              <span key={p} className="px-1 text-stone-300">…</span>
            ) : (
              <Button
                key={p}
                size="sm"
                variant={p === currentPage ? 'secondary' : 'primary'}
                onClick={() => onPageChange(p)}
                aria-current={p === currentPage ? 'page' : undefined}
                aria-label={`Page ${p}`}
                className="min-w-8"
              >
                {p}
              </Button>
            )
          ))}
          <Button
            size="icon-sm"
            icon={ChevronRight}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          />
        </nav>
      )}
    </div>
  );
}
