/**
 * AdminListPanel — container for a page's main list/table.
 *
 * Inside an AdminPageLayout with `fill`, the panel takes the remaining
 * viewport height: only its body scrolls (give table headers `sticky top-0`)
 * while the optional header and footer (e.g. AdminPagination) stay visible.
 * Elsewhere it behaves like a normal card.
 *
 * @param {ReactNode} [header]  - Pinned above the scrolling body
 * @param {ReactNode} [footer]  - Pinned below the scrolling body
 * @param {boolean}   [plain]   - No card chrome (for grids of cards)
 * @param {string}    [className]     - Extra classes for the panel
 * @param {string}    [bodyClassName] - Extra classes for the scrolling body
 */
export default function AdminListPanel({
  children,
  header,
  footer,
  plain = false,
  className = '',
  bodyClassName = '',
}) {
  const chrome = plain ? '' : 'bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden';
  return (
    <div className={`flex flex-col fit:flex-1 fit:min-h-0 ${chrome} ${className}`}>
      {header && <div className="shrink-0">{header}</div>}
      <div
        className={`fit:flex-1 fit:min-h-0 fit:overflow-y-auto overflow-x-auto overscroll-contain ${plain ? 'fit:p-1 fit:-m-1' : ''} ${bodyClassName}`}
        data-scroll-region
      >
        {children}
      </div>
      {footer && <div className={`shrink-0 ${plain ? 'pt-3' : 'border-t border-stone-100'}`}>{footer}</div>}
    </div>
  );
}
