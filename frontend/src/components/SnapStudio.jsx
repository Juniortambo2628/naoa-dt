import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Check, Layers, RefreshCw, Upload, X } from 'lucide-react';
import { polaroidService } from '../services/api';
import { compressImage } from '../utils/compressImage';
import Button from './Button';
import { buttonClass } from './buttonStyles';

/**
 * Snap Studio — the Snapchat-style camera behind "Snap a polaroid".
 *
 *  - live preview (getUserMedia) with a flip lens and a burst shutter that
 *    grabs several frames a third of a second apart
 *  - a filmstrip while shooting, then a review grid where the guest picks
 *    which shots to share (tap to keep/drop)
 *  - one upload for the whole selection: compressed here (2048px / 6MB),
 *    optimised again on the server, and posted into the story feed
 *
 * Falls back to a multi-file picker when the camera is unavailable or
 * denied (desktop, locked-down browsers) so the feature never dead-ends.
 */

const BURST_COUNT = 5;
const BURST_INTERVAL_MS = 350;
const MAX_PHOTOS = 10;

let shotSeq = 0;
const nextShotId = () => `shot-${Date.now()}-${(shotSeq += 1)}`;

const objectUrl = (blob) =>
  typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
    ? URL.createObjectURL(blob)
    : '';

const revokeUrl = (url) => {
  if (url && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
};

export default function SnapStudio({ guestCode, guestName, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const burstTimerRef = useRef(null);
  const inputRef = useRef(null);

  const [phase, setPhase] = useState('camera'); // camera | review | uploading | done | denied
  const [facing, setFacing] = useState('environment');
  const [burstMode, setBurstMode] = useState(false);
  const [shots, setShots] = useState([]);
  const [caption, setCaption] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  // Mirror of the shots for the unmount cleanup (a [] closure would be stale).
  const shotsRef = useRef(shots);
  shotsRef.current = shots;

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const stopBurst = () => {
    if (burstTimerRef.current) {
      clearInterval(burstTimerRef.current);
      burstTimerRef.current = null;
    }
  };

  // Camera lifecycle — restarts whenever the lens is flipped.
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPhase('denied');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setPhase('camera');
      } catch {
        if (!cancelled) setPhase('denied');
      }
    };

    start();

    return () => {
      cancelled = true;
      stopStream();
      stopBurst();
    };
  }, [facing]);

  useEffect(() => () => {
    stopBurst();
    stopStream();
    shotsRef.current.forEach((shot) => revokeUrl(shot.url));
  }, []);

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = objectUrl(blob);
      setShots((prev) => {
        if (prev.length >= MAX_PHOTOS) {
          revokeUrl(url);
          return prev;
        }
        return [
          ...prev,
          {
            id: nextShotId(),
            url,
            file: new File([blob], `snap-${prev.length + 1}.jpg`, { type: 'image/jpeg' }),
            selected: true,
          },
        ];
      });
    }, 'image/jpeg', 0.92);
  };

  const handleShutter = () => {
    setError(null);
    if (burstTimerRef.current) return; // burst already running

    if (!burstMode) {
      captureFrame();
      return;
    }

    let taken = 1;
    captureFrame();
    burstTimerRef.current = setInterval(() => {
      captureFrame();
      taken += 1;
      if (taken >= BURST_COUNT) stopBurst();
    }, BURST_INTERVAL_MS);
  };

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    setShots((prev) => {
      const room = MAX_PHOTOS - prev.length;
      const added = files.slice(0, Math.max(0, room)).map((file) => ({
        id: nextShotId(),
        url: objectUrl(file),
        file,
        selected: true,
      }));
      return [...prev, ...added];
    });
    setPhase('review');
  };

  const toggleShot = (id) =>
    setShots((prev) => prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)));

  const backToCamera = () => {
    setError(null);
    setPhase('camera');
  };

  const discardAll = () => {
    shots.forEach((s) => revokeUrl(s.url));
    setShots([]);
    setCaption('');
    setError(null);
    setPhase('camera');
  };

  const selected = shots.filter((s) => s.selected);

  const share = async () => {
    if (!selected.length) return;
    setPhase('uploading');
    setError(null);
    setProgress(0);

    try {
      const compressed = await Promise.all(
        selected.map((shot) => compressImage(shot.file, { maxWidthOrHeight: 2048, maxSizeMB: 6 })),
      );

      const form = new FormData();
      compressed.forEach((file) => form.append('images[]', file));
      form.append('guest_name', guestName || 'Wedding Guest');
      if (guestCode) form.append('guest_code', guestCode);
      if (caption.trim()) form.append('caption', caption.trim());

      await polaroidService.batchUpload(form, (event) => {
        if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
      });

      setPhase('done');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Upload failed. Please try again.');
      setPhase('review');
    }
  };

  const shareAgain = () => {
    shots.forEach((s) => revokeUrl(s.url));
    setShots([]);
    setCaption('');
    setProgress(0);
    setPhase('camera');
  };

  const close = () => {
    stopBurst();
    stopStream();
    onClose?.();
  };

  const chromeButton =
    'p-2.5 rounded-full bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 transition-colors';

  const shell = (
    <div
      className="fixed inset-0 z-[10001] flex flex-col bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Snap Studio"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button type="button" onClick={close} aria-label="Close Snap Studio" className={chromeButton}>
          <X className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium tracking-wide">Snap Studio</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBurstMode((on) => !on)}
            aria-pressed={burstMode}
            aria-label="Burst mode"
            className={burstMode ? buttonClass({ variant: 'secondary', size: 'icon' }) : chromeButton}
          >
            <Layers className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
            aria-label="Flip camera"
            className={chromeButton}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stage */}
      {phase === 'camera' && (
        <div className="relative flex-1 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-6 border-2 border-white/60 rounded-sm pointer-events-none" />
          {burstMode && (
            <span className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-xs font-medium">
              Burst · up to {BURST_COUNT} shots
            </span>
          )}
          {shots.length > 0 && (
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {shots.map((shot) => (
                  <img
                    key={shot.id}
                    src={shot.url}
                    alt=""
                    className="w-14 h-14 shrink-0 object-cover rounded border border-white/60"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'denied' && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 text-white/70" />
          </div>
          <h3 className="font-serif text-xl mb-2">Camera unavailable</h3>
          <p className="text-sm text-white/60 max-w-xs">
            No camera here, or access was declined — pick photos from your device instead. They go
            through the same checks and land in the story.
          </p>
        </div>
      )}

      {phase === 'review' && (
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {shots.map((shot) => (
              <button
                key={shot.id}
                type="button"
                onClick={() => toggleShot(shot.id)}
                aria-pressed={shot.selected}
                aria-label={shot.selected ? 'Remove this photo from the selection' : 'Keep this photo'}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                  shot.selected ? 'border-[#A67B5B]' : 'border-white/20 opacity-40'
                }`}
              >
                <img src={shot.url} alt="" className="w-full h-full object-cover" />
                <span
                  className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center ${
                    shot.selected ? 'bg-[#A67B5B] text-white' : 'bg-black/60 text-white'
                  }`}
                >
                  {shot.selected ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </span>
              </button>
            ))}
          </div>

          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={500}
            placeholder="Add a caption for these photos (optional)"
            className="mt-4 w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#A67B5B]"
          />

          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          {shots.length >= MAX_PHOTOS && (
            <p className="mt-3 text-xs text-white/50">That's the maximum of {MAX_PHOTOS} per share.</p>
          )}
        </div>
      )}

      {phase === 'uploading' && (
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <p className="font-serif text-xl mb-4">
            Sharing {selected.length} photo{selected.length === 1 ? '' : 's'}…
          </p>
          <div className="w-56 h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-[#A67B5B] transition-[width] duration-200"
              style={{ width: `${Math.max(8, progress)}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-white/50" aria-live="polite">{progress}%</p>
        </div>
      )}

      {phase === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <span className="w-14 h-14 rounded-full bg-[#A67B5B] flex items-center justify-center mb-4">
            <Check className="w-8 h-8" />
          </span>
          <h3 className="font-serif text-xl mb-2">Shared to Captured Moments!</h3>
          <p className="text-sm text-white/60 max-w-xs">
            Your photos are in the story now — watch them on the Programme page.
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="secondary" icon={Camera} onClick={shareAgain}>
              Snap again
            </Button>
            <Button icon={Check} onClick={close}>Done</Button>
          </div>
        </div>
      )}

      {/* Bottom controls (camera + denied: share from file in both cases) */}
      {(phase === 'camera' || phase === 'denied') && (
        <div className="px-6 pt-4 pb-8 flex items-center justify-between gap-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={handleFiles}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Choose photos from your device"
            className={chromeButton}
          >
            <Upload className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleShutter}
            disabled={phase !== 'camera'}
            aria-label={burstMode ? `Take a burst of ${BURST_COUNT} photos` : 'Take a photo'}
            className="w-20 h-20 rounded-full border-4 border-white/70 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <span className={`w-14 h-14 rounded-full ${burstMode ? 'bg-[#8B5E3C]' : 'bg-[#A67B5B]'}`} />
          </button>

          <button
            type="button"
            onClick={() => shots.length && setPhase('review')}
            disabled={!shots.length}
            aria-label={`Review ${shots.length} selected photos`}
            className={`${chromeButton} relative disabled:opacity-30`}
          >
            <Camera className="w-5 h-5" />
            {shots.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#A67B5B] text-[10px] font-bold flex items-center justify-center">
                {shots.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Review actions */}
      {phase === 'review' && (
        <div className="px-4 pb-8 pt-3 border-t border-white/10 flex gap-3">
          <Button variant="secondary" icon={Camera} onClick={backToCamera} className="flex-1">
            Shoot more
          </Button>
          <Button
            variant="secondary"
            onClick={discardAll}
            className="flex-1"
          >
            Discard all
          </Button>
          <Button
            icon={Upload}
            onClick={share}
            disabled={!selected.length}
            className="flex-[2]"
          >
            Share {selected.length || ''}
          </Button>
        </div>
      )}

      {phase === 'denied' && (
        <div className="px-6 pb-8 pt-3 flex justify-center">
          <Button icon={Upload} onClick={() => inputRef.current?.click()} className="w-full max-w-xs">
            Choose photos
          </Button>
        </div>
      )}
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(shell, document.body);
}
