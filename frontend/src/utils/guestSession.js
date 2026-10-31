/**
 * Remembers the guest's invitation code on this device, so a guest who has
 * opened their invitation once (in the browser or the home-screen web app)
 * isn't asked for the code again.
 *
 * Note: on iPhone the home-screen app has its own storage, separate from
 * Safari, so it remembers the code from the first time it's used there (or
 * from the invitation URL it was added from).
 */
const KEY = 'guestInviteCode';

export function getSavedGuestCode() {
  try {
    return localStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}

export function saveGuestCode(code) {
  if (!code) return;
  try {
    localStorage.setItem(KEY, String(code).trim());
  } catch {
    // Storage unavailable (private mode) — guests just re-enter the code.
  }
}

export function clearGuestCode() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** True when running as an installed home-screen web app. */
export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
