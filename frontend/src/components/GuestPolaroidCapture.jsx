import { useCallback, useEffect, useState } from 'react';
import { Camera, Images, Loader2, Trash2 } from 'lucide-react';
import { polaroidService } from '../services/api';
import { useGuestByCode } from '../hooks/useApiHooks';
import { confirmAction, notifyError } from '../utils/feedback';
import { getAssetUrl } from '../utils/assetUrl';
import { getSavedGuestCode } from '../utils/guestSession';
import Button from './Button';
import SnapStudio from './SnapStudio';

/**
 * Guest quick action "Snap a polaroid".
 *
 * Opens the camera straight away — no welcome panel in between. Closing the
 * studio lands on this panel, which is also where the guest manages what
 * they've shared: their own photos, each removable (deletes the photo, its
 * reactions and view counts on the server).
 */
export default function GuestPolaroidCapture({ guestCode }) {
  const { data: guest } = useGuestByCode(guestCode);
  const code = guestCode || getSavedGuestCode();

  // Straight to the camera on open (the request): the panel below is what
  // guests see when they come back out.
  const [studioOpen, setStudioOpen] = useState(true);
  const [mine, setMine] = useState(null); // null = still loading
  const [busyId, setBusyId] = useState(null);

  const loadMine = useCallback(async () => {
    if (!code) {
      setMine([]);
      return;
    }
    try {
      const res = await polaroidService.mine(code);
      setMine(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load my photos', err);
      setMine([]);
    }
  }, [code]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  const removePhoto = async (photo) => {
    const confirmed = await confirmAction('Delete this photo? It disappears from Captured Moments for everyone.');
    if (!confirmed) return;

    setBusyId(photo.id);
    try {
      await polaroidService.deleteMine(photo.id, code);
      setMine((prev) => (prev || []).filter((item) => item.id !== photo.id));
    } catch (err) {
      notifyError(err?.response?.data?.message || 'Could not delete that photo.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      {studioOpen && (
        <SnapStudio
          guestCode={code}
          guestName={guest?.name || 'Wedding Guest'}
          onClose={() => {
            setStudioOpen(false);
            loadMine(); // pick up whatever was just shared
          }}
        />
      )}

      <div className="w-16 h-16 rounded-full bg-[#A67B5B]/10 text-[#A67B5B] flex items-center justify-center mb-4">
        <Camera className="w-8 h-8" />
      </div>
      <h3 className="font-serif text-xl text-stone-800 mb-1">Snap a Polaroid</h3>
      <p className="text-stone-500 text-sm max-w-xs mb-5">
        Shoot once or in burst, pick the shots to share — they land in Captured Moments for
        everyone to watch and react to.
      </p>
      <Button variant="secondary" size="lg" icon={Camera} onClick={() => setStudioOpen(true)}>
        Open camera
      </Button>

      <div className="w-full max-w-md mt-8 text-left">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Your photos
          </h4>
          {mine !== null && (
            <span className="text-xs text-stone-400">{mine.length} shared</span>
          )}
        </div>

        {mine === null && (
          <div className="flex items-center gap-2 text-stone-400 text-sm py-4" role="status">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your photos…
          </div>
        )}

        {mine !== null && mine.length === 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-stone-200 p-4">
            <Images className="w-5 h-5 text-stone-300 shrink-0" />
            <p className="text-sm text-stone-500">
              Nothing shared yet — your photos will appear here so you can remove them any time.
            </p>
          </div>
        )}

        {mine !== null && mine.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {mine.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-stone-100"
              >
                <img
                  src={getAssetUrl(photo.full_image_url || photo.image_path)}
                  alt={photo.caption || 'Your photo'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo)}
                  disabled={busyId !== null}
                  aria-label={`Delete photo${photo.caption ? ` "${photo.caption}"` : ''}`}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-white/70 disabled:opacity-50 transition-colors"
                >
                  {busyId === photo.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
