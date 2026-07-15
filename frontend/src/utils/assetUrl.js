/**
 * Resolve a stored asset path into a browser-ready URL.
 *
 * Handles:
 * - Absolute external URLs (passed through)
 * - Localhost/dev URLs (pathname extracted, proxied by Vite)
 * - Legacy path prefixes (/wed-dt/backend/public, /backend/public)
 * - Static asset prefixes (/uploads, /storage, /illustrations)
 *
 * The production base URL is derived from VITE_API_URL; no URL is hardcoded.
 */

const baseURL = import.meta.env.VITE_API_URL || '/api';

const STATIC_ASSET_PREFIXES = ['/uploads', '/storage', '/illustrations'];
const LEGACY_PREFIXES = ['/wed-dt/backend/public', '/backend/public'];

function stripLegacyPrefixes(path) {
  for (const prefix of LEGACY_PREFIXES) {
    if (path.startsWith(prefix)) {
      return path.substring(prefix.length);
    }
  }
  return path;
}

function isStaticAsset(path) {
  return STATIC_ASSET_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function getApiOrigin() {
  if (baseURL.startsWith('http')) {
    try {
      return new URL(baseURL).origin;
    } catch {
      // fall through
    }
  }
  return '';
}

export function getAssetUrl(path) {
  if (!path) return '';

  let cleanPath = path;

  // Handle absolute URLs
  if (path.startsWith('http')) {
    try {
      const urlObj = new URL(path);
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const apiOrigin = getApiOrigin();

      // If the URL points to the same origin or the configured API origin,
      // reduce it to a relative path so Vite proxy / production routing works.
      if (
        urlObj.origin === currentOrigin ||
        urlObj.origin === apiOrigin
      ) {
        cleanPath = urlObj.pathname;
      } else {
        return path; // Truly external absolute URL
      }
    } catch {
      return path;
    }
  }

  cleanPath = stripLegacyPrefixes(cleanPath);

  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }

  const staticAsset = isStaticAsset(cleanPath);

  if (import.meta.env.DEV) {
    if (staticAsset) {
      return cleanPath;
    }

    const origin = getApiOrigin();
    const prefix = origin ? '' : baseURL === '/api' ? '/api' : baseURL;
    let finalUrl = `${origin}${prefix}${cleanPath}`;

    // Guard against accidental /api/ prefix on static assets
    if (
      finalUrl.includes('/api/uploads') ||
      finalUrl.includes('/api/illustrations') ||
      finalUrl.includes('/api/storage')
    ) {
      finalUrl = finalUrl.replace('/api/', '/');
    }

    return finalUrl;
  }

  // Production: prepend the configured API origin (or same-origin if none)
  return `${getApiOrigin() || (typeof window !== 'undefined' ? window.location.origin : '')}${cleanPath}`;
}

export default getAssetUrl;
