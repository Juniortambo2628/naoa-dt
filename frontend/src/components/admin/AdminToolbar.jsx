import { Search, List, Grid, LayoutGrid } from 'lucide-react';

const viewIcons = {
  list: List,
  grid: Grid,
  spreadsheet: LayoutGrid,
};

/**
 * AdminToolbar — consistent filter/search bar for admin pages.
 * Renders nothing if no props are meaningful (no search, no filters, no children).
 *
 * @param {string}   [search]            - Current search value
 * @param {function} [onSearchChange]     - Search change handler
 * @param {string}   [searchPlaceholder]  - Placeholder text
 * @param {Array}    [filters]            - Array of { id, label } filter options
 * @param {string}   [activeFilter]       - Currently active filter id
 * @param {function} [onFilterChange]     - Filter change handler
 * @param {string}   [viewMode]           - Current view mode
 * @param {Array}    [viewOptions]        - Array of view mode strings, e.g. ['list', 'spreadsheet']
 * @param {Array}    [sortOptions]        - Array of { id, label } sorting options
 * @param {string}   [activeSort]         - Currently active sort id
 * @param {function} [onSortChange]       - Sort change handler
 * @param {ReactNode} [children]          - Custom toolbar items
 */
export default function AdminToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  activeFilter,
  onFilterChange,
  sortOptions,
  activeSort,
  onSortChange,
  viewMode,
  viewOptions,
  onViewModeChange,
  children,
}) {
  const hasSearch = onSearchChange !== undefined;
  const hasFilters = filters && filters.length > 0;
  const hasSort = sortOptions && sortOptions.length > 0;
  const hasViewToggle = viewOptions && viewOptions.length > 1;
  const hasChildren = !!children;

  // Don't render if nothing to show
  if (!hasSearch && !hasFilters && !hasSort && !hasViewToggle && !hasChildren) return null;

  return (
    <div className="bg-white p-4 rounded-xl border border-stone-100 flex flex-col md:flex-row gap-4 items-start md:items-center mb-6">
      {/* Filter Pills */}
      {hasFilters && (
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 flex-shrink-0">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => onFilterChange?.(f.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === f.id
                  ? 'bg-[#A67B5B] text-white'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Sort Dropdown */}
      {hasSort && (
        <div className="flex-shrink-0">
          <select
            value={activeSort || ''}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="pl-3 pr-8 py-2 w-full rounded-lg border border-stone-200 focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] outline-none text-sm bg-stone-50 text-stone-600 appearance-none"
            style={{ 
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234A3F35' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1em 1em'
            }}
          >
            {sortOptions.map(option => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* View Mode Toggle */}
      {hasViewToggle && (
        <div className="bg-stone-50 rounded-lg border border-stone-200 p-1 flex flex-shrink-0">
          {viewOptions.map((mode) => {
            const IconComponent = viewIcons[mode] || List;
            return (
              <button
                key={mode}
                onClick={() => onViewModeChange?.(mode)}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-stone-800 shadow-sm'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
                title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} View`}
              >
                <IconComponent className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      )}

      {/* Custom children */}
      {hasChildren && (
        <div className="flex items-center gap-2 flex-shrink-0">{children}</div>
      )}
    </div>
  );
}
