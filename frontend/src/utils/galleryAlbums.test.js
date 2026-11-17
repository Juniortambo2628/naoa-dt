import { describe, it, expect } from 'vitest';
import { gallerySections, slideshowPhotos, randomFavourites, byTakenAt, chronologicalAlbums } from './galleryAlbums';

const albums = [
  { id: 2, title: 'The Wedding', event_date: '2026-11-14' },
  { id: 1, title: 'Ayie', event_date: '2026-11-12' },
];

describe('gallery albums', () => {
  it('puts the Ayie (Thursday) before the wedding (Saturday)', () => {
    expect(chronologicalAlbums(albums).map((a) => a.title)).toEqual(['Ayie', 'The Wedding']);
  });

  it('orders photos by when they were taken, then by file name', () => {
    const photos = [
      { id: 1, taken_at: '2026-11-14 15:00:00' },
      { id: 2, taken_at: '2026-11-14 09:30:00' },
      { id: 3, original_name: 'DSC_10.jpg' },
      { id: 4, original_name: 'DSC_2.jpg' },
    ];
    expect([...photos].sort(byTakenAt).map((p) => p.id)).toEqual([2, 1, 4, 3]);
  });

  it('builds sections in story order and leaves out empty ones', () => {
    const items = [
      { id: 10, gallery_album_id: 2, taken_at: '2026-11-14 12:00:00' },
      { id: 11, gallery_album_id: 1, taken_at: '2026-11-12 12:00:00' },
      { id: 12, gallery_album_id: null },
      { id: 13, is_guest_upload: true },
    ];
    const sections = gallerySections(items, albums);
    expect(sections.map((s) => s.title)).toEqual(['Ayie', 'The Wedding', 'More moments', 'From our guests']);
    expect(gallerySections([items[0]], albums).map((s) => s.title)).toEqual(['The Wedding']);
  });

  it('uses featured photos for the slideshow, else a spread of wide shots', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, gallery_album_id: 2, width: 1600, height: 1000, taken_at: `2026-11-14 10:${String(i).padStart(2, '0')}:00` }));
    expect(slideshowPhotos(items, albums, 5)).toHaveLength(5);
    items[7].is_featured = true;
    items[3].is_featured = true;
    expect(slideshowPhotos(items, albums).map((p) => p.id)).toEqual([4, 8]);
  });

  it('never shows hidden or guest photos in the slideshow', () => {
    const items = [
      { id: 1, gallery_album_id: 2, is_visible: false, is_featured: true },
      { id: 2, is_guest_upload: true, is_featured: true },
      { id: 3, gallery_album_id: 2 },
    ];
    expect(slideshowPhotos(items, albums).map((p) => p.id)).toEqual([3]);
  });

  it("puts a guest's photo in the album they chose, after the photographer's", () => {
    const items = [
      { id: 1, gallery_album_id: 1, is_guest_upload: true, uploaded_by: 'Achieng' },
      { id: 2, gallery_album_id: 1, taken_at: '2026-11-12 10:00:00' },
      { id: 3, is_guest_upload: true },
    ];
    const sections = gallerySections(items, albums);
    expect(sections.find((s) => s.title === 'Ayie').items.map((i) => i.id)).toEqual([2, 1]);
    expect(sections.find((s) => s.id === 'guests').items.map((i) => i.id)).toEqual([3]);
    expect(slideshowPhotos(items, albums).map((p) => p.id)).toEqual([2]);
  });

  it('plays every favourite, however many, in a random order', () => {
    const items = Array.from({ length: 120 }, (_, i) => ({ id: i + 1, gallery_album_id: 2, is_featured: i < 100 }));
    const all = randomFavourites(items, albums);
    expect(all).toHaveLength(100);
    expect(new Set(all.map((p) => p.id)).size).toBe(100);
    expect(all.every((p) => p.is_featured)).toBe(true);
    // A different order from the album order (fixed sequence for the test).
    let seed = 1;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const picked = randomFavourites(items, albums, 6, random);
    expect(picked).toHaveLength(6);
    expect(picked.map((p) => p.id)).not.toEqual([1, 2, 3, 4, 5, 6]);
  });
});
