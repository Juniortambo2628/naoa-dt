import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Check, Loader2, RefreshCw, Upload } from 'lucide-react';
import { galleryService } from '../services/api';
import { useGuestByCode } from '../hooks/useApiHooks';

/**
 * Downscale a captured photo so uploads stay snappy and within the backend's
 * 5MB limit. Falls back to the original file if the canvas path is unavailable.
 */
async function downscaleImage(file, maxDim = 1600, quality = 0.85) {
  try {
    if (typeof createImageBitmap !== 'function') return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    // Small enough already — don't re-encode.
    if (scale === 1 && file.size < 4 * 1024 * 1024) {
      bitmap.close?.();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) return file;
    return new File([blob], 'polaroid.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/**
 * Guest "Polaroid" quick action: snap a photo with the device camera, add a
 * short caption, and upload it to the shared gallery. Uses a capture-enabled
 * file input so it works across mobile and desktop.
 */
export default function GuestPolaroidCapture({ guestCode }) {
  const { data: guest } = useGuestByCode(guestCode);
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState('idle'); // idle | ready | uploading | success | error
  const [error, setError] = useState(null);
  // A subtle, fixed tilt so the preview feels like a real polaroid.
  const [tilt] = useState(() => Math.random() * 4 - 2);

  // Revoke the object URL when it changes or the component unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openCamera = () => inputRef.current?.click();

  const handleFile = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setStatus('ready');
    setError(null);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    setCaption('');
    setStatus('idle');
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const upload = async () => {
    if (!file) return;
    setStatus('uploading');
    setError(null);
    try {
      const image = await downscaleImage(file);
      const form = new FormData();
      form.append('image', image);
      form.append('guest_name', guest?.name || 'Wedding Guest');
      if (caption.trim()) form.append('caption', caption.trim());
      await galleryService.guestUpload(form);
      setStatus('success');
    } catch (err) {
      console.error('Polaroid upload failed', err);
      setError(err?.response?.data?.message || 'Upload failed. Please try again.');
      setStatus('error');
    }
  };

  const isUploading = status === 'uploading';

  // Shared polaroid frame used for both the preview and the success state.
  const renderPolaroid = (captionText, children = null) => (
    <motion.div
      initial={{ opacity: 0, y: 12, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{ type: 'spring', damping: 18, stiffness: 220 }}
      className="bg-white p-3 pb-4 rounded-sm shadow-xl border border-stone-200 w-full max-w-[280px]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
        {previewUrl && <img src={previewUrl} alt="Your photo" className="w-full h-full object-cover" />}
        {children}
      </div>
      <p className="mt-3 text-center font-serif text-stone-600 text-sm min-h-[1.25rem] px-1 break-words">
        {captionText}
      </p>
    </motion.div>
  );

  return (
    <div className="flex flex-col items-center text-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {status === 'idle' && (
        <>
          <div className="w-16 h-16 rounded-full bg-[#A67B5B]/10 text-[#A67B5B] flex items-center justify-center mb-4">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-xl text-stone-800 mb-1">Snap a Polaroid</h3>
          <p className="text-stone-500 text-sm max-w-xs mb-6">
            Take a quick photo to add to the couple&apos;s wedding gallery.
          </p>
          <button
            type="button"
            onClick={openCamera}
            className="inline-flex items-center gap-2 bg-gradient-to-br from-[#A67B5B] to-[#8C6A4D] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-[#A67B5B]/30 hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <Camera className="w-5 h-5" />
            Open camera
          </button>
        </>
      )}

      {(status === 'ready' || status === 'uploading' || status === 'error') && (
        <>
          {renderPolaroid(caption || 'Add a caption below')}

          <div className="w-full max-w-[280px] mt-5 space-y-3">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={255}
              placeholder="Add a short caption (optional)"
              disabled={isUploading}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/40 disabled:opacity-60"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={reset}
                disabled={isUploading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors disabled:opacity-60"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                type="button"
                onClick={upload}
                disabled={isUploading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-br from-[#A67B5B] to-[#8C6A4D] shadow-lg shadow-[#A67B5B]/30 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-70 disabled:hover:scale-100"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {status === 'error' ? 'Try again' : 'Share photo'}
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {status === 'success' && (
        <>
          {renderPolaroid(
            caption || 'Shared with love',
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/30 flex items-center justify-center"
            >
              <span className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg">
                <Check className="w-7 h-7" />
              </span>
            </motion.div>
          )}
          <h3 className="font-serif text-xl text-stone-800 mt-5 mb-1">Added to the gallery!</h3>
          <p className="text-stone-500 text-sm max-w-xs mb-5">
            Thank you for sharing a moment with the couple.
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-br from-[#A67B5B] to-[#8C6A4D] shadow-lg shadow-[#A67B5B]/30 hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <Camera className="w-5 h-5" />
            Take another
          </button>
        </>
      )}
    </div>
  );
}
