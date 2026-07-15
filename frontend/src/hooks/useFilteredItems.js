import { useMemo } from 'react';

export default function useFilteredItems(items, searchQuery, filterFn) {
  return useMemo(() => {
    if (!items) return [];
    
    const searchLower = (searchQuery || '').toLowerCase();
    
    if (!searchLower) return items;
    
    return items.filter(item => {
      if (filterFn) return filterFn(item, searchLower);
      
      // Default: search across all string values
      return Object.values(item).some(val => {
        if (typeof val === 'string') return val.toLowerCase().includes(searchLower);
        if (val && typeof val === 'object') return JSON.stringify(val).toLowerCase().includes(searchLower);
        return false;
      });
    });
  }, [items, searchQuery, filterFn]);
}
