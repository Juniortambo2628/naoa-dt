import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, User, Camera, Smartphone, Upload, Check, Images, AlertCircle } from 'lucide-react';
import Overlay from './Overlay';
import Button from './Button';
import CameraCapture from './CameraCapture';
import { galleryService } from '../services/api';
import { useGuestByCode } from '../hooks/useApiHooks';
import { getSavedGuestCode } from '../utils/guestSession';
import compressImage from '../utils/compressImage';
import { photoTakenAt } from '../utils/photoDate';
import { chronologicalAlbums } from '../utils/galleryAlbums';

const NAME_KEY = 'guestPhotoName';
const MAX_PHOTOS = 30;

const readName = () => { try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; } };
const keepName = (name) => { try { localStorage.setItem(NAME_KEY, name); } catch { /* private mode */ } };

/**
 * Guests share their own photos: choose which album they belong in (the
 * Ayie, the wedding...), pick several at once or take one, and they're added
 * one by one with their name on them.
 */
export default function GuestPhotoShare({ open, onClose, albums = [], defaultAlbumId = '', onShared }) {
  const ordered = useMemo(() => chronologicalAlbums(albums), [albums]);
  const { data: guest } = useGuestByCode(getSavedGuestCode());
  const [name, setName] = useState(readName);
  const [albumId, setAlbumId] = useState(defaultAlbumId);
  const [files, setFiles] = useState([]); // { file, url }
  const [camera, setCamera] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState(0);
  const [finished, setFinished] = useState(false);

  // A guest who opened their invitation here doesn't need to type their name.
  useEffect(() => { if (!name && guest?.name) setName(guest.name); }, [guest, name]);
  useEffect(() => { if (open) setAlbumId(defaultAlbumId || ordered[ordered.length - 1]?.id || ''); }, [open, defaultAlbumId, ordered]);

  const reset = () => {
    files.forEach((f) => URL.revokeObjectURL(f.url));
    setFiles([]); setDone(0); setFailed(0); setFinished(false); setSending(false);
  };
  const close = () => { if (!sending) { reset(); onClose(); } };

  const add = (list) => {
    const picked = Array.from(list || []).filter((f) => f.type.startsWith('image/'));
    setFiles((prev) => [...prev, ...picked.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, MAX_PHOTOS));
  };
  const remove = (index) => setFiles((prev) => {
    URL.revokeObjectURL(prev[index].url);
    return prev.filter((_, i) => i !== index);
  });

  const share = async (e) => {
    e.preventDefault();
    if (!files.length || !name.trim()) return;
    keepName(name.trim());
    setSending(true); setDone(0); setFailed(0);
    for (const { file } of files) {
      try {
        const takenAt = await photoTakenAt(file); // before compressing: that drops EXIF
        const small = await compressImage(file, { maxWidthOrHeight: 2400, maxSizeMB: 2.5 });
        const form = new FormData();
        form.append('image', small);
        form.append('guest_name', name.trim());
        if (albumId) form.append('gallery_album_id', albumId);
        if (takenAt) form.append('taken_at', takenAt);
        await galleryService.guestUpload(form);
        setDone((n) => n + 1);
      } catch {
        setFailed((n) => n + 1);
      }
    }
    setSending(false);
    setFinished(true);
    onShared?.();
  };

  const album = ordered.find((a) => String(a.id) === String(albumId));

  return (
    <>
      <AnimatePresence>
        {open && (
          <Overlay onClose={close}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-3xl" style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}>Share your photos</h2>
                <button type="button" aria-label="Close" onClick={close} className="p-2 hover:bg-stone-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {finished ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-lg font-medium text-stone-800">
                    Thank you! {done} {done === 1 ? 'photo' : 'photos'} added{album ? ` to ${album.title}` : ''}.
                  </p>
                  {failed > 0 && <p className="text-sm text-red-600">{failed} didn&apos;t upload. Please try those again.</p>}
                  <div className="flex justify-center gap-2">
                    <Button onClick={reset}>Share more</Button>
                    <Button variant="secondary" onClick={close}>Done</Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={share} className="space-y-5">
                  {ordered.length > 0 && (
                    <fieldset>
                      <legend className="input-label flex items-center gap-2"><Images className="w-4 h-4 text-[#A67B5B]" /> Which day are they from?</legend>
                      <div className="flex flex-wrap gap-2">
                        {[...ordered, { id: '', title: 'Something else' }].map((a) => (
                          <button
                            key={a.id || 'none'}
                            type="button"
                            aria-pressed={String(albumId) === String(a.id)}
                            onClick={() => setAlbumId(a.id)}
                            disabled={sending}
                            className={`rounded-full px-4 py-2 text-sm border transition-colors ${String(albumId) === String(a.id) ? 'bg-[#4A3F35] text-white border-[#4A3F35]' : 'bg-white text-stone-700 border-[#E4D6C2]'}`}
                          >
                            {a.title}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {files.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {files.map((f, i) => (
                        <div key={f.url} className="relative aspect-square rounded-lg overflow-hidden bg-stone-100">
                          <img src={f.url} alt="" className="w-full h-full object-cover" />
                          {!sending && (
                            <button type="button" aria-label="Remove photo" onClick={() => remove(i)} className="absolute top-1 right-1 p-0.5 bg-black/55 text-white rounded-full">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {!sending && files.length < MAX_PHOTOS && (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-stone-300 rounded-xl p-4 text-center cursor-pointer hover:border-[#A67B5B] hover:bg-stone-50">
                        <Camera className="w-7 h-7 text-[#A67B5B]" />
                        <span className="text-sm font-medium text-stone-700">{files.length ? 'Add more' : 'Choose photos'}</span>
                        <span className="text-xs text-stone-500">Up to {MAX_PHOTOS} at a time</span>
                        <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
                      </label>
                      <button type="button" onClick={() => setCamera(true)} className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-stone-300 rounded-xl p-4 text-center hover:border-[#A67B5B] hover:bg-stone-50">
                        <Smartphone className="w-7 h-7 text-[#A67B5B]" />
                        <span className="text-sm font-medium text-stone-700">Take a photo</span>
                        <span className="text-xs text-stone-500">With your camera</span>
                      </button>
                    </div>
                  )}

                  <div>
                    <label htmlFor="share-name" className="input-label flex items-center gap-2">
                      <User className="w-4 h-4 text-[#A67B5B]" /> Your name
                    </label>
                    <input id="share-name" type="text" required value={name} disabled={sending} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="So the couple know who took them" />
                  </div>

                  {sending && (
                    <div className="space-y-1" role="status">
                      <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div className="h-full bg-[#A67B5B] transition-all" style={{ width: `${Math.round(((done + failed) / files.length) * 100)}%` }} />
                      </div>
                      <p className="text-xs text-stone-600">Sharing {done + failed + 1 > files.length ? files.length : done + failed + 1} of {files.length}… keep this open.</p>
                    </div>
                  )}
                  {failed > 0 && !sending && <p className="flex items-center gap-1 text-xs text-red-600"><AlertCircle className="w-3.5 h-3.5" /> {failed} didn&apos;t upload.</p>}

                  <Button type="submit" variant="secondary" size="lg" fullWidth icon={Upload} loading={sending} disabled={!files.length || !name.trim()}>
                    {files.length > 1 ? `Share ${files.length} photos` : 'Share photo'}
                  </Button>
                </form>
              )}
            </motion.div>
          </Overlay>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {camera && (
          <CameraCapture
            onCapture={(file) => { add([file]); setCamera(false); }}
            onClose={() => setCamera(false)}
            aspectRatio="4:3"
          />
        )}
      </AnimatePresence>
    </>
  );
}
