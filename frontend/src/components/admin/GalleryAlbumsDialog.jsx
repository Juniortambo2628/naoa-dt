import { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import AdminModal from './AdminModal';
import Button from '../Button';
import DeleteButton from './DeleteButton';
import useAdminAction from '../../hooks/useAdminAction';
import { galleryService } from '../../services/api';
import { chronologicalAlbums } from '../../utils/galleryAlbums';

const INVALIDATE = [['galleryAlbums'], ['gallery']];
const blank = { title: '', subtitle: '', event_date: '' };

/**
 * The gallery's albums. Guests see them in date order, so the date is what
 * puts the Ayie (Thursday) before the wedding (Saturday).
 */
export default function GalleryAlbumsDialog({ isOpen, onClose, albums = [] }) {
  const [drafts, setDrafts] = useState({});
  const [adding, setAdding] = useState(blank);

  const valueOf = (album, field) => drafts[album.id]?.[field] ?? album[field] ?? '';
  const edit = (album, field, value) => setDrafts((d) => ({ ...d, [album.id]: { ...d[album.id], [field]: value } }));

  const save = useAdminAction((album) => galleryService.updateAlbum(album.id, {
    title: valueOf(album, 'title'),
    subtitle: valueOf(album, 'subtitle') || null,
    event_date: valueOf(album, 'event_date') || null,
  }), {
    key: (album) => album.id,
    success: 'Album saved',
    invalidate: INVALIDATE,
    onSuccess: (_res, album) => setDrafts((d) => { const next = { ...d }; delete next[album.id]; return next; }),
  });

  const create = useAdminAction(() => galleryService.createAlbum({
    title: adding.title.trim(),
    subtitle: adding.subtitle.trim() || null,
    event_date: adding.event_date || null,
  }), {
    key: () => 'new',
    success: 'Album added',
    invalidate: INVALIDATE,
    onSuccess: () => setAdding(blank),
  });

  const remove = useAdminAction((album) => galleryService.deleteAlbum(album.id), {
    key: (album) => album.id,
    confirm: (album) => ({ title: `Remove the "${album.title}" album?`, message: 'Its photos stay in the gallery, just without an album.', confirmLabel: 'Remove album' }),
    success: 'Album removed',
    invalidate: INVALIDATE,
  });

  const field = 'w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm';

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Albums" size="lg">
      <p className="text-sm text-stone-600 mb-4">Guests see albums in date order. Photos inside each album follow the time they were taken.</p>
      <div className="space-y-3">
        {chronologicalAlbums(albums).map((album) => (
          <div key={album.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_9.5rem_auto] gap-2 items-center rounded-xl border border-stone-200 p-3">
            <input aria-label="Album title" className={field} value={valueOf(album, 'title')} onChange={(e) => edit(album, 'title', e.target.value)} />
            <input aria-label="Album subtitle" className={field} placeholder="e.g. Thursday, 12 November" value={valueOf(album, 'subtitle')} onChange={(e) => edit(album, 'subtitle', e.target.value)} />
            <input aria-label="Album date" type="date" className={field} value={valueOf(album, 'event_date')} onChange={(e) => edit(album, 'event_date', e.target.value)} />
            <div className="flex items-center gap-1 justify-end">
              <span className="text-xs text-stone-500 mr-1">{album.photo_count ?? 0} photos</span>
              {drafts[album.id] && <Button size="sm" variant="secondary" icon={Save} action={save} args={[album]}>Save</Button>}
              <DeleteButton onClick={() => remove.run(album)} title="Remove album" />
            </div>
          </div>
        ))}
      </div>

      <form
        className="mt-5 grid grid-cols-1 sm:grid-cols-[1fr_1fr_9.5rem_auto] gap-2 items-center rounded-xl bg-[#FBF7F1] border border-[#E4D6C2] p-3"
        onSubmit={(e) => { e.preventDefault(); if (adding.title.trim()) create.run(); }}
      >
        <input aria-label="New album title" className={field} placeholder="New album, e.g. Reception" value={adding.title} onChange={(e) => setAdding({ ...adding, title: e.target.value })} />
        <input aria-label="New album subtitle" className={field} placeholder="Subtitle (optional)" value={adding.subtitle} onChange={(e) => setAdding({ ...adding, subtitle: e.target.value })} />
        <input aria-label="New album date" type="date" className={field} value={adding.event_date} onChange={(e) => setAdding({ ...adding, event_date: e.target.value })} />
        <Button type="submit" size="sm" variant="secondary" icon={Plus} disabled={!adding.title.trim()}>Add</Button>
      </form>
    </AdminModal>
  );
}
