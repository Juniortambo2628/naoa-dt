import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';

/**
 * AdminToolbarSearch — the single admin search box, rendered inside the shared
 * floating toolbar. Bound to the global SearchContext unless the page passes
 * its own `value` / `onChange`. Press "/" or Ctrl/⌘+K anywhere to focus it.
 *
 * @param {string}   [placeholder]
 * @param {string}   [value]     - Controlled value (defaults to the global query)
 * @param {function} [onChange]  - Change handler (defaults to the global setter)
 */
export default function AdminToolbarSearch({ placeholder = 'Search...', value, onChange }) {
  const global = useSearch();
  const query = value ?? global.searchQuery;
  const setQuery = onChange ?? global.setSearchQuery;
  const inputRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      const target = e.target;
      const typing = target instanceof HTMLElement
        && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      const isShortcut = (e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing);
      if (!isShortcut) return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        value={query || ''}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape' && query) { e.stopPropagation(); setQuery(''); } }}
        placeholder={placeholder}
        aria-label={placeholder}
        title="Search (press / to focus)"
        className="w-28 sm:w-52 xl:w-60 pl-9 pr-8 py-2 sm:py-2.5 rounded-xl border border-stone-200/60 bg-white/80 text-sm text-stone-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B] [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => { setQuery(''); inputRef.current?.focus(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
