import { motion } from 'framer-motion';
import AdminFloatingToolbar from './AdminFloatingToolbar';
import { SidePanelAside, SidePanelMobileBar } from './AdminSidePanel';
import useActivityPanel from './useActivityPanel';

/**
 * AdminPageLayout — standardized layout shared by every admin dashboard page.
 *
 * Order:
 *   1. Hero section (title, breadcrumb, description)
 *   2. Summary / overview cards (optional)
 *   3. Page content, with the shared side panel on its right (optional)
 *   + the shared floating toolbar (search, filters, page actions)
 *
 * The side panel (see AdminSidePanel) is where pages put their section
 * switcher, tools or secondary lists, so every page has the same shape. On
 * mobile it becomes a sticky chip bar / bottom sheet under the header.
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
 * @param {object}    [panel]          - Side panel config (see AdminSidePanel);
 *                                      pages without one get the Activity panel.
 *                                      A page panel makes the page fit the viewport
 *                                      like `fill` (the left column scrolls).
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
  panel: pagePanel,
}) {
  const activityPanel = useActivityPanel();
  const panel = pagePanel || activityPanel;
  const showToolbar = !toolbarHidden
    && ((actions && actions.length > 0) || search || filters || toolbarContent);

  const fillBody = 'space-y-6 fit:space-y-0 fit:flex fit:flex-col fit:gap-4 fit:flex-1 fit:min-h-0';
  // A page with its own side panel fits the viewport too, so the panel never
  // makes the page longer; its left column then scrolls on its own.
  const fitPage = fill || !!pagePanel;
  const bodyClass = fill
    ? fillBody
    : pagePanel
      ? 'space-y-6 fit:overflow-y-auto fit:overscroll-contain fit:min-h-0 fit:pr-1 fit:pb-2'
      : 'space-y-6';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        /* Extra bottom padding so content never hides behind the fixed
           floating toolbar (bottom-center), especially on mobile. */
        className={`admin-page-layout space-y-5 pb-28 lg:pb-24 ${
          fitPage
            ? 'fit:h-[calc(100dvh-7rem)] fit:flex fit:flex-col fit:overflow-hidden fit:space-y-0 fit:gap-5'
            : ''
        }`}
        data-layout={fitPage ? 'fill' : 'flow'}
      >
        {fitPage ? <div className="fit:shrink-0 space-y-5">{hero}{summary}</div> : <>{hero}{summary}</>}

        {panel.mobile !== false && <SidePanelMobileBar panel={panel} />}

        <div className={`lg:flex lg:gap-5 ${fitPage ? 'fit:flex-1 fit:min-h-0' : ''}`}>
          <div className={`lg:flex-1 min-w-0 ${bodyClass}`}>{children}</div>
          <SidePanelAside key={panel.id || panel.title} panel={panel} />
        </div>
      </motion.div>

      {showToolbar && (
        <AdminFloatingToolbar actions={actions} search={search} filters={filters}>
          {toolbarContent}
        </AdminFloatingToolbar>
      )}
    </>
  );
}
