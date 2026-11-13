/** What went wrong, in words an usher can act on. */
export function cameraErrorMessage(error) {
  const text = String(error?.name || '') + ' ' + String(error?.message || error || '');
  if (/NotAllowed|Permission|denied/i.test(text)) {
    return {
      title: 'Camera access is blocked',
      help: 'Allow the camera for this site, then tap Try again. On iPhone: tap “aA” in the address bar, Website Settings, Camera, Allow. On Android: tap the lock icon, Permissions, Camera.',
    };
  }
  if (/NotFound|Overconstrained|no camera|Requested device not found/i.test(text)) {
    return { title: 'No camera found', help: 'This device has no camera we can use. Find guests by name below instead.' };
  }
  if (/NotReadable|TrackStart|in use|Could not start/i.test(text)) {
    return { title: 'The camera is busy', help: 'Close other apps or tabs using the camera, then tap Try again.' };
  }
  if (/NotSupported|not supported/i.test(text)) {
    return { title: 'This browser can’t open the camera', help: 'Open this page in Safari (iPhone) or Chrome (Android), then tap Try again.' };
  }
  if (/secure|https|insecure/i.test(text)) {
    return { title: 'The camera needs a secure page', help: 'Open the site with https:// to use the camera.' };
  }
  return { title: 'The camera did not start', help: 'Tap Try again. If it keeps failing, find guests by name below.' };
}
