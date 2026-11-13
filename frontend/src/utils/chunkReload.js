/**
 * After a deploy, a tab opened before it still points at the old build's
 * file names, which are gone from the server, so opening a page that loads
 * lazily (Settings, for one) fails with "Failed to fetch dynamically imported
 * module". Reload once to pick up the new build. The guard stops a reload
 * loop if the file really is missing.
 */
const KEY = 'chunk-reload-at';
const WINDOW_MS = 60_000;

export function shouldReload(now = Date.now(), storage = window.sessionStorage) {
  try {
    const last = Number(storage.getItem(KEY)) || 0;
    if (now - last < WINDOW_MS) return false;
    storage.setItem(KEY, String(now));
    return true;
  } catch {
    return false;
  }
}

/** Browsers word a failed lazy import differently. */
export const isChunkLoadError = (error) => /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i
  .test(String(error?.message || error || ''));

export function initChunkReload() {
  const reloadOnce = (event) => {
    if (!shouldReload()) return;
    event?.preventDefault?.();
    window.location.reload();
  };
  // Vite's own signal when a lazy page or its styles fail to load.
  window.addEventListener('vite:preloadError', reloadOnce);
  // A lazy page that throws while rendering reaches the window as an error.
  window.addEventListener('error', (event) => { if (isChunkLoadError(event.error || event.message)) reloadOnce(event); });
  window.addEventListener('unhandledrejection', (event) => { if (isChunkLoadError(event.reason)) reloadOnce(event); });
}
