/**
 * When a photo was taken, read from its EXIF data (DateTimeOriginal), so the
 * gallery tells the day in order. Only JPEG/TIFF headers are read; anything
 * else, or a photo without EXIF, falls back to the file's own date.
 *
 * Read this before compressing: re-encoding in the browser drops EXIF.
 */

const DATE_TAGS = [0x9003, 0x9004, 0x0132]; // DateTimeOriginal, DateTimeDigitized, DateTime

/** "2026:11:14 14:05:09" -> "2026-11-14 14:05:09" */
export function exifDateToIso(text) {
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(String(text || '').trim());
  if (!m || m[1] === '0000') return null;
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`;
}

/** Find the EXIF date in a JPEG's bytes. Returns "YYYY-MM-DD HH:MM:SS" or null. */
export function readExifDate(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    const size = view.getUint16(offset + 2);
    if (marker === 0xffe1 && view.getUint32(offset + 4) === 0x45786966) { // "Exif"
      return readTiff(view, offset + 10);
    }
    if ((marker & 0xff00) !== 0xff00 || size < 2) return null;
    offset += 2 + size;
  }
  return null;
}

function readTiff(view, start) {
  if (start + 8 > view.byteLength) return null;
  const little = view.getUint16(start) === 0x4949;
  const u16 = (o) => view.getUint16(o, little);
  const u32 = (o) => view.getUint32(o, little);
  const found = {};

  const readIfd = (ifdOffset, depth) => {
    const at = start + ifdOffset;
    if (depth > 2 || at + 2 > view.byteLength) return;
    const count = u16(at);
    for (let i = 0; i < count; i += 1) {
      const entry = at + 2 + i * 12;
      if (entry + 12 > view.byteLength) return;
      const tag = u16(entry);
      if (tag === 0x8769) readIfd(u32(entry + 8), depth + 1); // the Exif sub-IFD
      else if (DATE_TAGS.includes(tag)) {
        const length = u32(entry + 4);
        const valueAt = start + u32(entry + 8);
        if (length >= 19 && valueAt + 19 <= view.byteLength) {
          let text = '';
          for (let k = 0; k < 19; k += 1) text += String.fromCharCode(view.getUint8(valueAt + k));
          found[tag] = text;
        }
      }
    }
  };

  readIfd(u32(start + 4), 0);
  for (const tag of DATE_TAGS) {
    const iso = exifDateToIso(found[tag]);
    if (iso) return iso;
  }
  return null;
}

const pad = (n) => String(n).padStart(2, '0');
const localIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

/** When the photo was taken: EXIF first, then the file's modified date. */
export async function photoTakenAt(file) {
  try {
    if (/jpe?g$/i.test(file.type) || /\.jpe?g$/i.test(file.name || '')) {
      const head = await file.slice(0, 256 * 1024).arrayBuffer();
      const exif = readExifDate(head);
      if (exif) return exif;
    }
  } catch { /* unreadable header: use the file date */ }
  return file.lastModified ? localIso(new Date(file.lastModified)) : null;
}

/** "DSC_2.jpg" before "DSC_10.jpg". */
export const naturalCompare = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
