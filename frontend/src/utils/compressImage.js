import imageCompression from 'browser-image-compression';

/**
 * The one client-side image compressor for every upload path (Snap Studio,
 * the gallery, admin media).
 *
 * Downscale + re-encode before the bytes leave the phone, so uploads land
 * well under the backend's 20MB ceiling on any connection — and, because the
 * browser re-encodes them, EXIF (including GPS) metadata never travels with
 * the photo. SVGs and animated GIFs are passed through untouched.
 *
 * @param {File|Blob} file
 * @param {{maxWidthOrHeight?: number, maxSizeMB?: number}} [options]
 * @returns {Promise<File|Blob>}
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidthOrHeight = 2048,
    maxSizeMB = 6,
    ...rest
  } = options;

  if (!file || typeof file === 'string') return file;
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

  try {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight,
      maxSizeMB,
      useWebWorker: true,
      ...rest,
    });

    // Keep a predictable name/type for FormData and server-side extension
    // sniffing (compression can hand back a Blob).
    if (compressed instanceof Blob && !(compressed instanceof File)) {
      const ext = compressed.type === 'image/png' ? 'png' : 'jpg';
      const base = (file.name || 'photo').replace(/\.[^.]+$/, '');
      return new File([compressed], `${base}.${ext}`, { type: compressed.type, lastModified: Date.now() });
    }
    return compressed;
  } catch (err) {
    console.warn('Image compression skipped', err);
    return file;
  }
}

export default compressImage;
