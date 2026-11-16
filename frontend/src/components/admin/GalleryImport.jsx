import { useEffect, useMemo, useRef, useState } from 'react';
import { FolderUp, ImagePlus, Pause, Play, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import AdminModal from './AdminModal';
import Button from '../Button';
import useAdminAction from '../../hooks/useAdminAction';
import { galleryService } from '../../services/api';
import compressImage from '../../utils/compressImage';
import { photoTakenAt, naturalCompare } from '../../utils/photoDate';

/** Photos sent at the same time. Three keeps a home connection busy without choking it. */
const PARALLEL = 3;
const IMAGE = /\.(jpe?g|png|webp|heic|heif)$/i;

const mb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(bytes > 1024 * 1024 * 1024 ? 0 : 1)} MB`;

/**
 * Bulk import for a photographer's delivery: pick an album, choose the
 * unzipped folder (or the photos), and each one is shrunk to web size in the
 * browser, sent, and filed with the time it was taken. Photos already in that
 * album are skipped, so a stopped import can just be started again.
 */
export default function GalleryImport({ isOpen, onClose, albums = [], defaultAlbumId = null, onImported }) {
  const [albumId, setAlbumId] = useState(defaultAlbumId ?? albums[0]?.id ?? '');
  const [files, setFiles] = useState([]);
  const [publish, setPublish] = useState(true);
  const [state, setState] = useState('idle'); // idle | running | paused | done
  const [counts, setCounts] = useState({ added: 0, skipped: 0, failed: 0 });
  const [failures, setFailures] = useState([]);
  const pausedRef = useRef(false);
  const queueRef = useRef([]);

  useEffect(() => {
    if (isOpen && !albumId && albums[0]) setAlbumId(albums[0].id);
  }, [isOpen, albums, albumId]);

  // Leaving the page mid-import loses the rest of the queue: ask first.
  useEffect(() => {
    if (state !== 'running') return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [state]);

  const totalBytes = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files]);
  const processed = counts.added + counts.skipped + counts.failed;
  const percent = files.length ? Math.round((processed / files.length) * 100) : 0;
  const album = albums.find((a) => String(a.id) === String(albumId));

  const choose = (list) => {
    const picked = Array.from(list || []).filter((f) => f.type.startsWith('image/') || IMAGE.test(f.name));
    picked.sort((a, b) => naturalCompare(a.webkitRelativePath || a.name, b.webkitRelativePath || b.name));
    setFiles(picked);
    setCounts({ added: 0, skipped: 0, failed: 0 });
    setFailures([]);
    setState('idle');
  };

  const importAll = useAdminAction(async (batch) => {
    queueRef.current = [...batch];
    pausedRef.current = false;
    setState('running');

    const sendOne = async (file) => {
      const takenAt = await photoTakenAt(file); // before compressing: that drops EXIF
      const small = await compressImage(file, { maxWidthOrHeight: 2400, maxSizeMB: 2.5 });
      const form = new FormData();
      form.append('image', small, file.name.replace(/\.(heic|heif)$/i, '.jpg'));
      form.append('original_name', file.name);
      if (albumId) form.append('gallery_album_id', albumId);
      if (takenAt) form.append('taken_at', takenAt);
      form.append('is_visible', publish ? '1' : '0');
      const res = await galleryService.importPhoto(form);
      return res?.data?.skipped ? 'skipped' : 'added';
    };

    const worker = async () => {
      while (queueRef.current.length && !pausedRef.current) {
        const file = queueRef.current.shift();
        try {
          const outcome = await sendOne(file);
          setCounts((c) => ({ ...c, [outcome]: c[outcome] + 1 }));
        } catch (err) {
          setCounts((c) => ({ ...c, failed: c.failed + 1 }));
          setFailures((f) => [...f, { file, reason: err?.response?.data?.message || err?.message || 'Upload failed' }]);
        }
      }
    };

    await Promise.all(Array.from({ length: PARALLEL }, worker));
    setState(pausedRef.current ? 'paused' : 'done');
    return { remaining: queueRef.current.length };
  }, {
    key: () => 'import',
    error: false,
    invalidate: [['gallery'], ['galleryAlbums']],
    onSuccess: () => onImported?.(),
  });

  const start = () => importAll.run(files);
  const pause = () => { pausedRef.current = true; };
  const resume = () => importAll.run(queueRef.current);
  const retryFailed = () => {
    const again = failures.map((f) => f.file);
    setFailures([]);
    setCounts((c) => ({ ...c, failed: 0 }));
    importAll.run(again);
  };

  const busy = state === 'running';

  return (
    <AdminModal isOpen={isOpen} onClose={busy ? () => {} : onClose} title="Import photos" size="lg">
      <div className="space-y-5">
        <p className="text-sm text-stone-600">
          Unzip the photographer&apos;s files first, then choose the folder. Each photo is shrunk to web size on this
          computer before it&apos;s sent (a 1.25 GB folder becomes roughly a tenth of that), and filed by the time it was taken.
        </p>

        <label className="block">
          <span className="block text-sm font-medium text-stone-700 mb-1">Album</span>
          <select
            value={albumId}
            disabled={busy}
            onChange={(e) => setAlbumId(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
          >
            {albums.map((a) => (
              <option key={a.id} value={a.id}>{a.title}{a.subtitle ? ` · ${a.subtitle}` : ''}</option>
            ))}
            <option value="">No album</option>
          </select>
        </label>

        {state === 'idle' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#C4A385]/60 p-5 text-center cursor-pointer hover:bg-[#FBF7F1]">
              <FolderUp className="w-7 h-7 text-[#A67B5B]" />
              <span className="text-sm font-medium text-stone-800">Choose a folder</span>
              <span className="text-xs text-stone-500">Every photo inside it</span>
              <input type="file" className="sr-only" webkitdirectory="" directory="" multiple onChange={(e) => choose(e.target.files)} />
            </label>
            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#C4A385]/60 p-5 text-center cursor-pointer hover:bg-[#FBF7F1]">
              <ImagePlus className="w-7 h-7 text-[#A67B5B]" />
              <span className="text-sm font-medium text-stone-800">Choose photos</span>
              <span className="text-xs text-stone-500">Select many at once</span>
              <input type="file" className="sr-only" accept="image/*" multiple onChange={(e) => choose(e.target.files)} />
            </label>
          </div>
        )}

        {files.length > 0 && (
          <div className="rounded-2xl bg-[#FBF7F1] border border-[#E4D6C2] p-4 space-y-3">
            <p className="text-sm text-stone-700">
              <strong>{files.length}</strong> photos ({mb(totalBytes)}) into <strong>{album ? album.title : 'no album'}</strong>
            </p>

            {state !== 'idle' && (
              <>
                <div className="h-2 rounded-full bg-white overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-[#A67B5B] transition-all" style={{ width: `${percent}%` }} />
                </div>
                <p className="text-xs text-stone-600">
                  {processed} of {files.length} · {counts.added} added · {counts.skipped} already there
                  {counts.failed ? ` · ${counts.failed} failed` : ''}
                </p>
              </>
            )}

            {state === 'idle' && (
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
                Show them on the website straight away
              </label>
            )}

            {busy && <p className="text-xs text-stone-500">Keep this tab open until it finishes. You can pause and carry on later.</p>}
            {state === 'done' && (
              <p className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4" /> Done. {counts.added} photos added{counts.skipped ? `, ${counts.skipped} were already there` : ''}.
              </p>
            )}
          </div>
        )}

        {failures.length > 0 && !busy && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 space-y-1 max-h-40 overflow-auto">
            <p className="flex items-center gap-2 font-medium"><AlertCircle className="w-4 h-4" /> {failures.length} didn&apos;t upload</p>
            {failures.slice(0, 8).map((f) => <p key={f.file.name} className="text-xs">{f.file.name}: {f.reason}</p>)}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {state === 'idle' && <Button onClick={onClose}>Cancel</Button>}
          {state === 'idle' && files.length > 0 && (
            <Button variant="secondary" icon={ImagePlus} onClick={start}>Import {files.length} photos</Button>
          )}
          {busy && <Button icon={Pause} onClick={pause}>Pause</Button>}
          {state === 'paused' && <Button variant="secondary" icon={Play} onClick={resume}>Carry on</Button>}
          {failures.length > 0 && !busy && <Button icon={RotateCcw} onClick={retryFailed}>Try the failed ones again</Button>}
          {(state === 'done' || state === 'paused') && <Button onClick={onClose}>Close</Button>}
        </div>
      </div>
    </AdminModal>
  );
}
