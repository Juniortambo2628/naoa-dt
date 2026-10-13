import { createContext, useContext, useState } from 'react';

const SearchContext = createContext(null);

// Outside a provider (e.g. a component rendered on its own in a test) search
// is simply inert rather than crashing.
const INERT_SEARCH = { searchQuery: '', setSearchQuery: () => {} };

export function SearchProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </SearchContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSearch() {
  return useContext(SearchContext) ?? INERT_SEARCH;
}
