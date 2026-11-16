import { describe, it, expect } from 'vitest';
import { readExifDate, exifDateToIso, naturalCompare } from './photoDate';

/** A minimal JPEG: SOI + APP1 Exif (little-endian) with IFD0 -> Exif IFD -> DateTimeOriginal. */
function jpegWithDate(date) {
  const tiff = [];
  const u16 = (n) => tiff.push(n & 0xff, (n >> 8) & 0xff);
  const u32 = (n) => { u16(n & 0xffff); u16((n >>> 16) & 0xffff); };
  tiff.push(0x49, 0x49); u16(42); u32(8);              // header, IFD0 at 8
  u16(1); u16(0x8769); u16(4); u32(1); u32(26); u32(0); // IFD0: pointer to Exif IFD at 26
  u16(1); u16(0x9003); u16(2); u32(20); u32(44); u32(0); // Exif IFD: DateTimeOriginal at 44
  for (const ch of `${date}\0`) tiff.push(ch.charCodeAt(0));
  const app1 = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
  const len = app1.length + 2;
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, len >> 8, len & 0xff, ...app1, 0xff, 0xd9]).buffer;
}

describe('photo dates', () => {
  it('reads DateTimeOriginal from a JPEG', () => {
    expect(readExifDate(jpegWithDate('2026:11:12 16:45:03'))).toBe('2026-11-12 16:45:03');
  });

  it('returns null for files without EXIF', () => {
    expect(readExifDate(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer)).toBeNull();
    expect(readExifDate(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer)).toBeNull();
  });

  it('ignores blank camera dates', () => {
    expect(exifDateToIso('0000:00:00 00:00:00')).toBeNull();
  });

  it('sorts file names the way people count', () => {
    expect(['DSC_10.jpg', 'DSC_2.jpg', 'DSC_1.jpg'].sort(naturalCompare)).toEqual(['DSC_1.jpg', 'DSC_2.jpg', 'DSC_10.jpg']);
  });
});
