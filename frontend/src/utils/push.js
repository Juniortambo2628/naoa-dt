import { pushService } from '../services/api';
import { isStandalone } from './guestSession';
import { isIos } from './installPrompt';

/**
 * Guest web push helpers. The service worker (public/sw.js) is registered at
 * start-up; these turn notifications on/off for this device.
 */

export function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('Service worker registration failed', err));
  });
}

export function isPushSupported() {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** iPhone only offers push to sites added to the home screen. */
export function needsInstallForPush() {
  return isIos() && !isStandalone();
}

const urlBase64ToUint8Array = (base64) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

export async function getPushSubscription() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

/** Asks permission, subscribes this device and tells the server. */
export async function enablePush(code) {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    const error = new Error('permission');
    error.permission = permission;
    throw error;
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const { data } = await pushService.getPublicKey();
  const subscription = (await registration.pushManager.getSubscription())
    || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.public_key),
    });

  await pushService.subscribe({ ...subscription.toJSON(), code });
  return subscription;
}

export async function disablePush() {
  const subscription = await getPushSubscription();
  if (!subscription) return;
  await pushService.unsubscribe(subscription.endpoint).catch(() => {});
  await subscription.unsubscribe();
}
