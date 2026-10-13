import { useCallback, useState } from 'react';

const read = (key) => {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

/**
 * Named snapshots of a page's filters, kept in this browser.
 * @param {string} storageKey
 * @returns {{ views: Array<{ id, name, state }>, saveView(name, state), deleteView(id) }}
 */
export default function useSavedViews(storageKey) {
  const [views, setViews] = useState(() => read(storageKey));

  const persist = useCallback((next) => {
    setViews(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode): views last for this visit.
    }
  }, [storageKey]);

  const saveView = useCallback((name, state) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const others = views.filter((v) => v.name.toLowerCase() !== trimmed.toLowerCase());
    persist([...others, { id: `${Date.now()}`, name: trimmed, state }]);
  }, [views, persist]);

  const deleteView = useCallback((id) => persist(views.filter((v) => v.id !== id)), [views, persist]);

  return { views, saveView, deleteView };
}
