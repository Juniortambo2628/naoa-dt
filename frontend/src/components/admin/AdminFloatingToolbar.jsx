import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, ChevronUp, ChevronDown } from 'lucide-react';
import AdminToolbarSearch from './AdminToolbarSearch';
import AdminToolbarFilters, { countActiveFilters } from './AdminToolbarFilters';
import { useSearch } from '../../context/SearchContext';
import Button from '../Button';
import { useVisibleActions } from '../../hooks/useRole';

/**
 * AdminFloatingToolbar — the shared, fixed bottom-center toolbar that every
 * admin page uses for its search box, filters and page-level actions.
 * AdminPageLayout renders it for you; it portals into document.body so it is
 * never mis-positioned by an animated (transformed) ancestor.
 *
 * @param {Array} actions - Array of action objects:
 *   {
 *     id: string,
 *     label: string,
 *     icon: LucideIcon,
 *     onClick: () => void,
 *     variant?: 'primary' | 'secondary' | 'danger',  // see components/Button
 *     disabled?: boolean,
 *     hidden?: boolean,
 *     readOnly?: boolean, // viewing/exporting only — every other action is hidden for viewers
 *   }
 * @param {React.ReactNode} children - optional custom controls rendered inside
 *   the same bar, before the actions (e.g. the invitation designer's page and
 *   undo/redo controls), so every floating control shares one toolbar.
 * @param {boolean|string|object} search - show the shared search box: true, a
 *   placeholder string, or { placeholder, value, onChange } for page-local search.
 * @param {object} filters - filter/sort/view config, see AdminToolbarFilters.
 * @param {string} z - z-index utility class for the fixed wrapper (default z-50).
 * @param {string} wrapperClassName - extra classes for the fixed wrapper.
 */
export default function AdminFloatingToolbar({
  actions = [],
  children = null,
  search = null,
  filters = null,
  z = 'z-50',
  wrapperClassName = '',
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const { searchQuery } = useSearch();

  const visibleActions = useVisibleActions(actions).filter((a) => !a.hidden);
  const searchProps = !search ? null
    : typeof search === 'string' ? { placeholder: search }
    : typeof search === 'object' ? search
    : {};
  const hasLeading = !!searchProps || !!filters;
  if (visibleActions.length === 0 && !children && !hasLeading) return null;

  // While hidden, flag that the list is still being narrowed.
  const narrowed = (searchProps && (searchProps.value ?? searchQuery)) || countActiveFilters(filters) > 0;

  // Show the first actions directly (fewer when search/filters share the bar,
  // so it stays on one row); collapse the rest into a "More" menu.
  const maxPrimary = hasLeading ? 2 : 4;
  const primaryActions = visibleActions.slice(0, maxPrimary);
  const overflowActions = visibleActions.slice(maxPrimary);
  const hasOverflow = overflowActions.length > 0;

  return createPortal(
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="toolbar"
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`fixed bottom-6 left-1/2 lg:left-[calc(50%+140px)] -translate-x-1/2 ${z} w-max max-w-[calc(100vw-1.5rem)] lg:max-w-[calc(100vw-280px-1.5rem)] ${wrapperClassName}`}
        >
          <div
            className="flex flex-wrap items-center justify-center gap-2 px-2 py-2 rounded-2xl border border-white/40 shadow-2xl backdrop-blur-md"
            style={{
              background: 'rgba(255, 249, 245, 0.92)',
              boxShadow: '0 12px 40px rgba(74, 63, 53, 0.18)',
            }}
          >
            {searchProps && <AdminToolbarSearch {...searchProps} />}
            {filters && <AdminToolbarFilters filters={filters} />}
            {hasLeading && (children || visibleActions.length > 0) && (
              <div className="w-px h-6 bg-stone-200/70 mx-0.5" />
            )}
            {children}
            {children && visibleActions.length > 0 && (
              <div className="w-px h-6 bg-stone-200/70 mx-0.5" />
            )}
            {primaryActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant}
                icon={action.icon}
                onClick={action.onClick}
                disabled={action.disabled}
                title={action.label}
                aria-label={action.label}
              >
                {/* Custom controls (e.g. the designer's tools) need the room, so
                    action labels then only show on very wide screens. */}
                <span className={children ? 'hidden 2xl:inline' : 'hidden sm:inline'}>{action.label}</span>
              </Button>
            ))}

            {hasOverflow && (
              <div className="relative">
                <Button icon={MoreHorizontal} onClick={() => setMenuOpen((v) => !v)} aria-label="More actions">
                  <span className="hidden sm:inline">More</span>
                </Button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[10rem] bg-white rounded-xl shadow-xl border border-stone-100 py-2 overflow-hidden"
                    >
                      {overflowActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.id}
                            onClick={() => {
                              action.onClick();
                              setMenuOpen(false);
                            }}
                            disabled={action.disabled}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-stone-50 transition-colors ${
                              action.variant === 'danger' ? 'text-red-600' : 'text-stone-700'
                            } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {Icon && <Icon className="w-4 h-4" />}
                            {action.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Visibility toggler */}
            <button aria-label="Hide toolbar"
              onClick={() => setVisible(false)}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-white/60 transition-colors"
              title="Hide toolbar"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.button
          key="toolbar-toggle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setVisible(true)}
          className={`fixed bottom-6 left-1/2 lg:left-[calc(50%+140px)] -translate-x-1/2 ${z} p-2.5 rounded-full bg-white/90 border border-stone-200 shadow-lg text-[#A67B5B] hover:bg-white transition-colors ${wrapperClassName}`}
          title={narrowed ? 'Show toolbar (search or filters active)' : 'Show toolbar'}
        >
          <ChevronUp className="w-5 h-5" />
          {narrowed && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#A67B5B]" />
          )}
        </motion.button>
      )}
    </AnimatePresence>,
    document.body
  );
}
