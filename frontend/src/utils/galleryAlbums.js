import { naturalCompare } from './photoDate';

/** Photos within an album: when they were taken, then by file name, then by upload. */
export function byTakenAt(a, b) {
  const ta = a.taken_at ? Date.parse(String(a.taken_at).replace(' ', 'T')) : NaN;
  const tb = b.taken_at ? Date.parse(String(b.taken_at).replace(' ', 'T')) : NaN;
  if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return ta - tb;
  if (!Number.isNaN(ta) !== !Number.isNaN(tb)) return Number.isNaN(ta) ? 1 : -1;
  if (a.original_name && b.original_name) {
    const byName = naturalCompare(a.original_name, b.original_name);
    if (byName) return byName;
  }
  return (a.order ?? 0) - (b.order ?? 0) || (a.id ?? 0) - (b.id ?? 0);
}

/** Albums in the order things happened (the API already sends them so; this keeps it true). */
export function chronologicalAlbums(albums = []) {
  return [...albums].sort((a, b) => {
    if (!a.event_date !== !b.event_date) return a.event_date ? -1 : 1;
    return String(a.event_date || '').localeCompare(String(b.event_date || ''))
      || (a.order ?? 0) - (b.order ?? 0)
      || a.id - b.id;
  });
}

/**
 * The gallery as sections, in story order: each album in date order (guests'
 * photos added to an album sit in it, after the photographer's), then photos
 * that aren't in an album ("More moments"), then guests' photos without an
 * album. Empty sections are left out.
 */
export function gallerySections(items = [], albums = []) {
  const albumIds = new Set(albums.map((a) => a.id));
  const sections = chronologicalAlbums(albums).map((album) => ({
    id: `album-${album.id}`,
    album,
    title: album.title,
    subtitle: album.subtitle || '',
    items: [
      ...items.filter((i) => !i.is_guest_upload && i.gallery_album_id === album.id).sort(byTakenAt),
      ...items.filter((i) => i.is_guest_upload && i.gallery_album_id === album.id).sort(byTakenAt),
    ],
  }));
  sections.push({
    id: 'more',
    album: null,
    title: 'More moments',
    subtitle: '',
    items: items.filter((i) => !i.is_guest_upload && !albumIds.has(i.gallery_album_id)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || b.id - a.id),
  });
  sections.push({
    id: 'guests',
    album: null,
    title: 'From our guests',
    subtitle: 'Photos shared by family and friends',
    items: items.filter((i) => i.is_guest_upload && !albumIds.has(i.gallery_album_id)).sort((a, b) => b.id - a.id),
  });
  return sections.filter((s) => s.items.length > 0);
}

/**
 * Photos for the home page slideshow: the ones marked "featured", in story
 * order; if none are marked yet, a spread of landscape shots from the albums.
 */
export function slideshowPhotos(items = [], albums = [], max = 8) {
  const ordered = gallerySections(items.filter((i) => i.is_visible !== false), albums)
    .flatMap((s) => s.items)
    .filter((i) => !i.is_guest_upload);
  const featured = ordered.filter((i) => i.is_featured);
  if (featured.length) return featured.slice(0, max);
  const wide = ordered.filter((i) => !i.width || !i.height || i.width >= i.height);
  const pool = wide.length >= 3 ? wide : ordered;
  if (pool.length <= max) return pool;
  const step = pool.length / max;
  return Array.from({ length: max }, (_, k) => pool[Math.floor(k * step)]);
}

/** A copy of the list in random order (Fisher–Yates). */
export function shuffled(list = [], random = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Every slideshow photo, in a fresh random order: the couple's favourites
 * are all equally important, so each visit starts somewhere different and
 * every one of them gets its turn. Pass `count` for a handful (a collage).
 */
export function randomFavourites(items = [], albums = [], count = Infinity, random = Math.random) {
  return shuffled(slideshowPhotos(items, albums, Infinity), random).slice(0, count);
}

/** Best image for a grid tile: the thumbnail when there is one. */
export const thumbOf = (item) => item?.thumb_url || item?.image_url;
