import { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

/**
 * Slots in the sticky admin header that pages can render into:
 *   - titleSlot:  compact page title shown once the page hero scrolls away
 *   - statusSlot: page status, e.g. the invitation designer's save indicator
 * AdminShell owns the DOM nodes; pages portal into them, so nothing re-renders
 * the header when page content changes.
 */
const AdminChromeContext = createContext({ titleSlot: null, statusSlot: null });

export const AdminChromeProvider = AdminChromeContext.Provider;

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminChrome() {
  return useContext(AdminChromeContext);
}

/** Renders its children into the header's status area (if mounted). */
export function AdminHeaderStatus({ children }) {
  const { statusSlot } = useAdminChrome();
  return statusSlot ? createPortal(children, statusSlot) : null;
}
