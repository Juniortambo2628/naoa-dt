import { motion } from 'framer-motion';
import AdminFloatingToolbar from './AdminFloatingToolbar';

/**
 * AdminPageLayout — standardized layout shared by every admin dashboard page.
 *
 * Order:
 *   1. Hero section (title, breadcrumb, description)
 *   2. Summary / overview cards (optional)
 *   3. Page content
 *   + the shared floating toolbar (search, filters, page actions)
 *
 * Listing pages pass `fill`: on desktop-sized viewports the page then fits the
 * viewport exactly — hero, summary cards and the list's pagination stay put
 * and only the rows inside an AdminListPanel scroll. Smaller screens keep
 * normal page scrolling.
 *
 * @param {ReactNode} hero     - AdminPageHero element
 * @param {ReactNode} summary  - AdminSummaryCards element (optional)
 * @param {ReactNode} children - Main page content
 * @param {Array}     [actions]        - Page actions for the shared toolbar
 * @param {boolean|string|object} [search] - Show the shared search box (see AdminFloatingToolbar)
 * @param {object}    [filters]        - Filter/sort/view config (see AdminToolbarFilters)
 * @param {ReactNode} [toolbarContent] - Custom controls rendered inside the toolbar
 * @param {boolean}   [toolbarHidden]  - Hide the toolbar (e.g. while a bulk-selection bar is shown)
 * @param {boolean}   [fill]           - Fit the viewport; content scrolls inside AdminListPanel
 */
export default function AdminPageLayout({
  hero,
  summary,
  children,
  actions,
  search,
  filters,
  toolbarContent,
  toolbarHidden = false,
  fill = false,
}) {
  const showToolbar = !toolbarHidden
    && ((actions && actions.length > 0) || search || filters || toolbarContent);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        /* Extra bottom padding so content never hides behind the fixed
           floating toolbar (bottom-center), especially on mobile. */
        className={`admin-page-layout space-y-6 pb-28 lg:pb-24 ${
          fill
            ? 'fit:h-[calc(100dvh-7rem)] fit:flex fit:flex-col fit:overflow-hidden fit:space-y-0 fit:gap-5'
            : ''
        }`}
        data-layout={fill ? 'fill' : 'flow'}
      >
        {fill ? <div className="fit:shrink-0 space-y-5">{hero}{summary}</div> : <>{hero}{summary}</>}

        {fill ? (
          <div className="space-y-6 fit:space-y-0 fit:flex fit:flex-col fit:gap-4 fit:flex-1 fit:min-h-0">
            {children}
          </div>
        ) : children}
      </motion.div>

      {showToolbar && (
        <AdminFloatingToolbar actions={actions} search={search} filters={filters}>
          {toolbarContent}
        </AdminFloatingToolbar>
      )}
    </>
  );
}
