/**
 * Invitation multi-page model helpers.
 *
 * The invitation/save-the-date "theme" used to be a single flat design object
 * (items, content, bgImage, overlay settings, frame, orientation, ...).
 *
 * To support multiple pages we now store a *document*:
 *
 *   {
 *     // shared across every page
 *     accentColor, orientation, showGrid, snapToGrid, editorLang,
 *     // one entry per page
 *     pages: [ { id, items, content, bgImage, overlay*, frame, ... }, ... ]
 *   }
 *
 * These helpers convert between the legacy flat shape and the new document
 * shape, and flatten a single page back into the flat shape that
 * InvitationCanvas / InvitationSidebar / InvitationExportContainer already
 * understand. That keeps those components untouched and fully backward
 * compatible with themes saved before multi-page support existed.
 */

// Fields that live on the document and are shared by all pages.
import { WEDDING_DEFAULTS } from './weddingDefaults';

export const SHARED_KEYS = ['accentColor', 'orientation', 'showGrid', 'snapToGrid', 'editorLang'];

const pickShared = (design = {}) => ({
  accentColor: design.accentColor ?? '#A67B5B',
  orientation: design.orientation ?? 'portrait',
  showGrid: design.showGrid ?? true,
  snapToGrid: design.snapToGrid ?? true,
  editorLang: design.editorLang ?? 'en',
});

let pageSeq = 0;
const freshId = (prefix) => `${prefix}_${Date.now()}_${pageSeq++}`;

const ensurePageId = (page = {}) => ({
  id: page.id || freshId('page'),
  ...page,
});

/**
 * Normalize any theme value (null, legacy flat design, or document) into a
 * document with a `pages` array and shared fields at the top level.
 */
export function toDocument(design) {
  if (!design || typeof design !== 'object') {
    return { ...pickShared(), pages: [createBlankPage(pickShared(), { withDefaults: true })] };
  }

  // Already a document.
  if (Array.isArray(design.pages)) {
    const shared = pickShared(design);
    const pages = design.pages.length ? design.pages.map(ensurePageId) : [createBlankPage(shared, { withDefaults: true })];
    return { ...shared, pages };
  }

  // Legacy flat design -> single page document.
  const shared = pickShared(design);
  const pageFields = { ...design };
  SHARED_KEYS.forEach(k => delete pageFields[k]);
  delete pageFields.pages;
  return { ...shared, pages: [ensurePageId(pageFields)] };
}

/**
 * Flatten one page of a document into the flat design shape the canvas and
 * sidebar consume (page fields + shared fields merged together).
 */
export function getPageDesign(doc, pageIndex = 0) {
  const document = toDocument(doc);
  const index = Math.max(0, Math.min(pageIndex, document.pages.length - 1));
  const page = document.pages[index] || {};
  return {
    ...page,
    accentColor: document.accentColor,
    orientation: document.orientation,
    showGrid: document.showGrid,
    snapToGrid: document.snapToGrid,
    editorLang: document.editorLang,
  };
}

/**
 * Return every page of a theme as a flat design (used by the exporter and the
 * public invitation view to render/export all pages).
 */
export function normalizePages(design) {
  const document = toDocument(design);
  return document.pages.map((_, i) => getPageDesign(document, i));
}

export function pageCount(design) {
  return toDocument(design).pages.length;
}

/**
 * Build a brand new blank page. Reuses the `title` / `message` text keys since
 * content is now scoped per page, so the existing sidebar text controls work
 * on whichever page is active.
 */
export function createBlankPage(shared = {}, { withDefaults = false } = {}) {
  const accent = shared.accentColor || '#A67B5B';
  const isLandscape = shared.orientation === 'landscape';
  const canvasW = isLandscape ? 625 : 500;
  const canvasH = isLandscape ? 500 : 625;

  const titleId = freshId('title');
  const messageId = freshId('message');
  const frameId = freshId('frame');

  const heading = withDefaults ? WEDDING_DEFAULTS.coupleNames : 'More Information';
  const body = withDefaults ? 'We invite you to celebrate our wedding' : 'Add your extra details here — directions, schedule, gifts, dress code…';

  return {
    id: freshId('page'),
    name: withDefaults ? 'Main' : 'More Information',
    bgImage: null,
    backgroundColor: '#ffffff',
    overlayOpacity: 0,
    overlayColor: '#ffffff',
    showIllustrations: false,
    showOuterOutline: false,
    frame: { visible: true, color: accent, thickness: 1, padding: 20 },
    content: {
      en: { title: heading, message: body },
      zh: { title: heading, message: '' },
      ms: { title: heading, message: '' },
      luo: { title: heading, message: '' },
    },
    items: [
      { id: titleId, type: 'text', textKey: 'title', x: 25, y: isLandscape ? 60 : 90, width: canvasW - 50, height: 90, fontStyle: 'cursive', fontSize: 44, zIndex: 50, textAlign: 'center' },
      { id: messageId, type: 'text', textKey: 'message', x: 40, y: isLandscape ? 170 : 210, width: canvasW - 80, height: canvasH - (isLandscape ? 230 : 280), fontStyle: 'serif', fontSize: 18, letterSpacing: 0, zIndex: 25, textAlign: 'center', verticalAlign: 'top' },
      { id: frameId, type: 'frame', x: 20, y: 20, width: canvasW - 40, height: canvasH - 40, color: accent, thickness: 2, zIndex: 10 },
    ],
  };
}

/** Deep-clone a page and give it (and its items) brand new ids. */
export function clonePage(page) {
  const clone = JSON.parse(JSON.stringify(page));
  clone.id = freshId('page');
  clone.name = page.name ? `${page.name} copy` : undefined;
  if (Array.isArray(clone.items)) {
    clone.items = clone.items.map((item) => {
      const isTitle = item.textKey === 'title';
      const isMessage = item.textKey === 'message';
      // Keep the shared title/message keys so sidebar inputs keep working;
      // give custom text/elements fresh ids.
      const newItem = { ...item, id: freshId(item.type || 'item') };
      if (!isTitle && !isMessage && item.type === 'text') {
        // custom text element keeps its content key so text is preserved
        newItem.textKey = item.textKey;
      }
      return newItem;
    });
  }
  return clone;
}
