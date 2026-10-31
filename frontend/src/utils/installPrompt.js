/**
 * Captures the browser's "install app" prompt (Chrome/Edge/Android) as early
 * as possible — it fires once, often before React mounts — so the
 * "Add to home screen" button can trigger it later.
 */
let deferredPrompt = null;
const listeners = new Set();

const notify = () => listeners.forEach((fn) => fn(deferredPrompt));

export function initInstallPrompt() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

export function getInstallPrompt() {
  return deferredPrompt;
}

export function onInstallPromptChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Shows the native prompt; resolves true when the guest accepts. */
export async function promptInstall() {
  if (!deferredPrompt) return false;
  const prompt = deferredPrompt;
  deferredPrompt = null;
  notify();
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  return outcome === 'accepted';
}

export function isIos() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
