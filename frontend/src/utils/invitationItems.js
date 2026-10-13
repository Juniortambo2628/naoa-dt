/*
 * Pure helpers for invitation canvas elements: canvas size, nudging,
 * aligning/distributing a selection, layer order and style copy/paste.
 * Each returns a list of { id, ...changes } updates for the designer.
 */

export const canvasSize = (orientation) => (orientation === 'landscape'
  ? { width: 625, height: 500 }
  : { width: 500, height: 625 });

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));

/** Move items by (dx, dy), keeping them on the canvas. Locked items stay put. */
export function nudgeItems(items, dx, dy, canvas) {
  return items
    .filter((item) => !item.locked)
    .map((item) => ({
      id: item.id,
      x: Math.round(clamp((item.x || 0) + dx, 0, canvas.width - item.width)),
      y: Math.round(clamp((item.y || 0) + dy, 0, canvas.height - item.height)),
    }));
}

/** Bounding box of several items. */
export function boundsOf(items) {
  const left = Math.min(...items.map((i) => i.x || 0));
  const top = Math.min(...items.map((i) => i.y || 0));
  const right = Math.max(...items.map((i) => (i.x || 0) + i.width));
  const bottom = Math.max(...items.map((i) => (i.y || 0) + i.height));
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

/**
 * Align items to each other (2+ items) or to the page (a single item).
 * mode: left | center | right | top | middle | bottom
 */
export function alignItems(items, mode, canvas) {
  const movable = items.filter((i) => !i.locked);
  if (!movable.length) return [];
  const box = items.length > 1 ? boundsOf(items) : { left: 0, top: 0, right: canvas.width, bottom: canvas.height, width: canvas.width, height: canvas.height };
  const place = {
    left: () => ({ x: box.left }),
    center: (i) => ({ x: box.left + (box.width - i.width) / 2 }),
    right: (i) => ({ x: box.right - i.width }),
    top: () => ({ y: box.top }),
    middle: (i) => ({ y: box.top + (box.height - i.height) / 2 }),
    bottom: (i) => ({ y: box.bottom - i.height }),
  }[mode];
  if (!place) return [];
  return movable.map((item) => {
    const changes = place(item);
    return Object.fromEntries([['id', item.id], ...Object.entries(changes).map(([k, v]) => [k, Math.round(v)])]);
  });
}

/** Even spacing between 3+ items along an axis ('horizontal' | 'vertical'). */
export function distributeItems(items, axis) {
  if (items.length < 3) return [];
  const [pos, size] = axis === 'vertical' ? ['y', 'height'] : ['x', 'width'];
  const sorted = [...items].sort((a, b) => (a[pos] || 0) - (b[pos] || 0));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const span = (last[pos] + last[size]) - first[pos];
  const gap = (span - sorted.reduce((sum, i) => sum + i[size], 0)) / (sorted.length - 1);
  let cursor = first[pos];
  return sorted.map((item) => {
    const update = { id: item.id, [pos]: Math.round(cursor) };
    cursor += item[size] + gap;
    return update;
  }).filter((u, idx) => !sorted[idx].locked);
}

/** Layer order from a top-to-bottom list of ids (as shown in the Layers panel). */
export function layerOrder(idsTopFirst) {
  const count = idsTopFirst.length;
  return idsTopFirst.map((id, index) => ({ id, zIndex: (count - index) * 10 }));
}

/** Items sorted top layer first, without mutating the input. */
export const byLayerTopFirst = (items) => [...items].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

/** Visual properties that "Copy style" carries between elements. */
export const STYLE_KEYS = ['fontStyle', 'fontSize', 'color', 'textAlign', 'verticalAlign', 'letterSpacing', 'italic', 'opacity', 'thickness'];

export function pickStyle(item) {
  return Object.fromEntries(STYLE_KEYS.filter((key) => item[key] !== undefined).map((key) => [key, item[key]]));
}

/** Apply a copied style; text-only keys are skipped for other element types. */
export function applyStyle(items, style) {
  const textOnly = ['fontStyle', 'textAlign', 'verticalAlign', 'letterSpacing', 'italic'];
  return items.map((item) => ({
    id: item.id,
    ...Object.fromEntries(Object.entries(style).filter(([key]) => item.type === 'text' || !textOnly.includes(key))),
  }));
}
