import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, List, Grid, LayoutGrid, RotateCcw, Check } from 'lucide-react';

const viewIcons = {
  list: List,
  grid: Grid,
  spreadsheet: LayoutGrid,
};

const defaultOf = (group) => group.defaultValue ?? group.options?.[0]?.id;

/** Number of filter groups set to something other than their default. */
// eslint-disable-next-line react-refresh/only-export-components
export function countActiveFilters(filters) {
  return (filters?.groups || []).filter((g) => g.value !== defaultOf(g)).length;
}

/**
 * AdminToolbarFilters — every filtering control for a page, rendered inside the
 * shared floating toolbar: a "Filters" button that opens a panel of filter
 * groups, sort order and page-specific extras, plus an inline view toggle.
 *
 * @param {object} filters
 * @param {Array}  [filters.groups] - [{ id, label, options: [{ id, label, count? }], value, onChange, defaultValue? }]
 * @param {object} [filters.sort]   - { options: [{ id, label }], value, onChange, defaultValue? }
 * @param {object} [filters.view]   - { options: ['list' | 'grid' | 'spreadsheet'], value, onChange }
 * @param {ReactNode} [filters.extra] - Custom controls shown at the bottom of the panel
 */
export default function AdminToolbarFilters({ filters }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!filters) return null;

  const groups = (filters.groups || []).filter((g) => g.options?.length > 0);
  const sort = filters.sort?.options?.length > 0 ? filters.sort : null;
  const view = filters.view?.options?.length > 1 ? filters.view : null;
  const hasPanel = groups.length > 0 || !!sort || !!filters.extra;
  if (!hasPanel && !view) return null;

  const activeCount = countActiveFilters(filters);
  const sortChanged = sort && sort.value !== defaultOf(sort);
  const canReset = activeCount > 0 || sortChanged;

  // Name the active choice on the button when only one group is filtered.
  const activeGroups = groups.filter((g) => g.value !== defaultOf(g));
  const buttonLabel = activeGroups.length === 1
    ? activeGroups[0].options.find((o) => o.id === activeGroups[0].value)?.label || 'Filters'
    : 'Filters';

  const reset = () => {
    groups.forEach((g) => g.value !== defaultOf(g) && g.onChange?.(defaultOf(g)));
    if (sortChanged) sort.onChange?.(defaultOf(sort));
  };

  return (
    <>
      {hasPanel && (
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              activeCount > 0
                ? 'bg-[#A67B5B]/10 text-[#8B5E3C] border-[#A67B5B]/30'
                : 'bg-white/80 text-[#4A3F35] hover:bg-white border-stone-200/60'
            }`}
            title="Filter & sort"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline max-w-[10rem] truncate">{buttonLabel}</span>
            {activeCount > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-[#A67B5B] text-white text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                role="dialog"
                aria-label="Filters"
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 mb-3 w-[min(20rem,calc(100vw-2rem))] max-h-[60vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-stone-100 p-4 space-y-4 text-left"
              >
                {groups.map((group) => (
                  <div key={group.id}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-2">
                      {group.label || 'Show'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.options.map((option) => {
                        const active = group.value === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => group.onChange?.(option.id)}
                            aria-pressed={active}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              active
                                ? 'bg-[#A67B5B] text-white'
                                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                            }`}
                          >
                            {active && <Check className="w-3.5 h-3.5" />}
                            {option.label}
                            {option.count !== undefined && (
                              <span className={`text-xs ${active ? 'text-white/80' : 'text-stone-400'}`}>
                                {option.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {sort && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-2">
                      {sort.label || 'Sort by'}
                    </p>
                    <select
                      value={sort.value || ''}
                      onChange={(e) => sort.onChange?.(e.target.value)}
                      aria-label={sort.label || 'Sort by'}
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B]"
                    >
                      {sort.options.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {filters.extra && <div className="space-y-2">{filters.extra}</div>}

                {canReset && (
                  <button
                    type="button"
                    onClick={reset}
                    className="w-full flex items-center justify-center gap-2 pt-3 border-t border-stone-100 text-sm text-stone-500 hover:text-[#A67B5B]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to defaults
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {view && (
        <div className="bg-white/80 rounded-xl border border-stone-200/60 p-1 flex" role="group" aria-label="View mode">
          {view.options.map((mode) => {
            const Icon = viewIcons[mode] || List;
            const label = `${mode.charAt(0).toUpperCase()}${mode.slice(1)} view`;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => view.onChange?.(mode)}
                aria-pressed={view.value === mode}
                aria-label={label}
                title={label}
                className={`p-1.5 rounded-lg transition-colors ${
                  view.value === mode ? 'bg-[#A67B5B] text-white shadow-sm' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
