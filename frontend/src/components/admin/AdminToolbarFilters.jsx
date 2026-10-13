import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, List, Grid, LayoutGrid, RotateCcw, Check, Bookmark, BookmarkPlus, X } from 'lucide-react';
import SegmentedControl from '../SegmentedControl';

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
 * @param {object} [filters.views]  - Saved views: { items: [{ id, name }], onApply(id), onSave(), onDelete(id) }
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
  const views = filters.views || null;
  const hasPanel = groups.length > 0 || !!sort || !!filters.extra || !!views;
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
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-2">
                      {group.label || 'Show'}
                    </p>
                    <SegmentedControl
                      aria-label={group.label || 'Show'}
                      size="sm"
                      className="flex-wrap"
                      value={group.value}
                      onChange={(id) => group.onChange?.(id)}
                      options={group.options.map((option) => {
                        const active = group.value === option.id;
                        return {
                          value: option.id,
                          icon: active ? Check : undefined,
                          label: (
                            <>
                              {option.label}
                              {option.count !== undefined && (
                                <span className={active ? 'text-white/80' : 'text-stone-400'}>{option.count}</span>
                              )}
                            </>
                          ),
                        };
                      })}
                    />
                  </div>
                ))}

                {sort && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-2">
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

                {views && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-2">Saved views</p>
                    <div className="flex flex-wrap gap-1.5">
                      {views.items.map((view) => (
                        <span key={view.id} className="inline-flex items-center rounded-lg bg-stone-50 text-sm text-stone-700">
                          <button type="button" onClick={() => { views.onApply(view.id); setOpen(false); }} className="flex items-center gap-1.5 pl-2.5 pr-1 py-1.5 hover:text-[#A67B5B]">
                            <Bookmark className="w-3.5 h-3.5 text-[#A67B5B]" />
                            {view.name}
                          </button>
                          <button type="button" onClick={() => views.onDelete(view.id)} className="p-1.5 text-stone-400 hover:text-red-500" aria-label={`Delete saved view ${view.name}`}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <button type="button" onClick={views.onSave} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-[#A67B5B]/40 text-sm text-[#A67B5B] hover:bg-[#A67B5B]/5">
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        Save current view
                      </button>
                    </div>
                  </div>
                )}

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
        <SegmentedControl
          aria-label="View mode"
          value={view.value}
          onChange={(mode) => view.onChange?.(mode)}
          options={view.options.map((mode) => {
            const label = `${mode.charAt(0).toUpperCase()}${mode.slice(1)} view`;
            return { value: mode, icon: viewIcons[mode] || List, ariaLabel: label, title: label };
          })}
        />
      )}
    </>
  );
}
