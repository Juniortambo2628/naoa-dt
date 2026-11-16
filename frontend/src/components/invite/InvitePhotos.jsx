import { Link } from 'react-router-dom';
import { Images, Upload } from 'lucide-react';
import { useGallery, useGalleryAlbums } from '../../hooks/useApiHooks';
import { getAssetUrl } from '../../services/api';
import { gallerySections, slideshowPhotos, thumbOf } from '../../utils/galleryAlbums';
import Button from '../Button';

/**
 * The gallery, up front on the invitation: a few photos, the albums, and the
 * way in. After the wedding it's the first thing guests see.
 */
export default function InvitePhotos({ after = false }) {
  const { data: items = [] } = useGallery();
  const { data: albums = [] } = useGalleryAlbums();
  const visible = (Array.isArray(items) ? items : []).filter((i) => i.is_visible !== false);
  const picks = slideshowPhotos(visible, albums, 6);
  const sections = gallerySections(visible, albums).filter((s) => s.album || s.id === 'guests');

  if (!picks.length && !after) return null;

  return (
    <section id="photos" aria-labelledby="invite-photos-title" className="scroll-mt-24 rounded-3xl bg-white border border-palette-light-brown/40 shadow-sm overflow-hidden">
      {picks.length > 0 && (
        <Link to="/gallery" className="grid grid-cols-3 gap-0.5 bg-[#EFE6D8]" aria-label="Open the gallery">
          {picks.slice(0, 6).map((photo, i) => (
            <img
              key={photo.id}
              src={getAssetUrl(thumbOf(photo))}
              alt=""
              loading="lazy"
              className={`w-full aspect-square object-cover ${i === 0 && picks.length >= 5 ? 'col-span-2 row-span-2 aspect-auto h-full' : ''}`}
              style={{ objectPosition: photo.object_position || 'center' }}
            />
          ))}
        </Link>
      )}
      <div className="p-5 md:p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9A7148]">{after ? 'The photos are in' : 'Gallery'}</p>
          <h2 id="invite-photos-title" className="mt-1 font-serif text-2xl text-stone-800">
            {after ? 'Relive the day with us' : 'Moments so far'}
          </h2>
          {after && (
            <p className="mt-1 text-sm text-stone-500">
              {picks.length ? 'From the Ayie to the wedding day. Save your favourites, and add the ones you took.' : 'The photographers’ photos are on their way. Add the ones you took in the meantime.'}
            </p>
          )}
        </div>
        {sections.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <Link key={section.id} to={`/gallery#${section.id}`} className="rounded-full bg-[#FBF7F1] border border-[#E4D6C2] px-3 py-1.5 text-sm text-stone-700 hover:bg-white">
                {section.title} <span className="text-stone-400">· {section.items.length}</span>
              </Link>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/gallery"><Button variant="secondary" size="lg" icon={Images} fullWidth>Open the gallery</Button></Link>
          <Link to="/gallery?share=1"><Button size="lg" icon={Upload} fullWidth>Share your photos</Button></Link>
        </div>
      </div>
    </section>
  );
}
