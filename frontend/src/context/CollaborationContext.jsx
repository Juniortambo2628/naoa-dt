import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { collaborationService } from '../services/api';
import { moduleForPath } from '../utils/adminModules';

/** How often the dashboard reports where you are and asks what changed. */
export const HEARTBEAT_MS = 20000;

const CollaborationContext = createContext({
  presence: [],
  badges: {},
  module: null,
  othersHere: [],
  historyOpen: false,
  openHistory: () => {},
  closeHistory: () => {},
  shareOpen: false,
  setShareOpen: () => {},
  dataVersion: 0,
  notifyDataRestored: () => {},
});

/**
 * Working together in the admin dashboard:
 *  - presence: other collaborators online and the module (page) each is on
 *  - badges:   per-module count of changes by others since you last opened it
 *  - the Share and Version history panels' open state (opened from the header)
 *  - dataVersion: bumped after restoring a version, so AdminShell remounts the
 *    page and it reloads its data
 *
 * One heartbeat request every HEARTBEAT_MS (and on every page change) serves
 * presence and badges; it pauses while the tab is hidden.
 */
export function CollaborationProvider({ children }) {
  const { pathname } = useLocation();
  const module = moduleForPath(pathname)?.key || null;
  const [state, setState] = useState({ presence: [], badges: {} });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const latest = useRef({ module, pathname });
  latest.current = { module, pathname };

  const beat = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
    try {
      const res = await collaborationService.heartbeat({ module: latest.current.module, path: latest.current.pathname });
      setState({ presence: res.data?.presence || [], badges: res.data?.badges || {} });
    } catch {
      // Presence is best-effort; the next beat tries again.
    }
  }, []);

  // Report each page change right away (marks that module's changes as seen).
  useEffect(() => { beat(); }, [module, pathname, beat]);

  useEffect(() => {
    const timer = setInterval(beat, HEARTBEAT_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') beat(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [beat]);

  const value = useMemo(() => ({
    ...state,
    module,
    othersHere: state.presence.filter((p) => module && p.current_module === module),
    historyOpen,
    openHistory: () => setHistoryOpen(true),
    closeHistory: () => setHistoryOpen(false),
    shareOpen,
    setShareOpen,
    dataVersion,
    notifyDataRestored: () => { setDataVersion((v) => v + 1); beat(); },
  }), [state, module, historyOpen, shareOpen, dataVersion, beat]);

  return <CollaborationContext.Provider value={value}>{children}</CollaborationContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCollaboration() {
  return useContext(CollaborationContext);
}
