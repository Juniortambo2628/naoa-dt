import {
  Type, Sliders, Copy, Trash2, Layers, BringToFront, SendToBack, ArrowUp, ArrowDown,
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, Crosshair, AlignLeft, AlignCenter, AlignRight,
  ArrowUpToLine, ArrowDownToLine, AlignJustify, CaseSensitive, Italic, Palette, Droplet, RotateCw, RotateCcw,
  Plus, Grid3x3, Magnet, RectangleHorizontal, RectangleVertical, ImageOff, LayoutTemplate, Square,
  Lock, Unlock, Paintbrush, ClipboardPaste, BoxSelect, AlignStartVertical, AlignEndVertical,
  AlignStartHorizontal, AlignEndHorizontal, AlignHorizontalSpaceAround, AlignVerticalSpaceAround,
} from 'lucide-react';
import { ELEMENT_KINDS } from './invitationElements';

const ITEM_NAMES = {
  text: 'Text',
  image: 'Image',
  frame: 'Frame',
  rsvp_code: 'RSVP Code',
  calendar_link: 'Save the Date',
  venue_location: 'Location',
};

const FONT_NAMES = { cursive: 'Script', serif: 'Serif', sans: 'Sans' };

export const itemName = (item) => ITEM_NAMES[item?.type] || 'Element';

// eslint-disable-next-line react-refresh/only-export-components -- menu-local helper
function ColorRow({ value, presets, onChange }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {presets.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-label={`Use colour ${color}`}
          className={`w-6 h-6 rounded-full border ${value === color ? 'ring-2 ring-offset-1 ring-[#A67B5B]' : 'border-stone-200'}`}
          style={{ background: color }}
        />
      ))}
      <label className="w-6 h-6 rounded-full border border-dashed border-stone-300 flex items-center justify-center cursor-pointer overflow-hidden" title="Custom colour">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="opacity-0 w-0 h-0" aria-label="Custom colour" />
        <Plus className="w-3 h-3 text-stone-400" />
      </label>
    </div>
  );
}

/**
 * Right-click menu for a canvas element: every adjustment the sidebar offers
 * for that element type, grouped into submenus.
 */
export function buildItemMenu(item, ctx) {
  const { update, move, duplicate, remove, editProperties, presetColors, accentColor } = ctx;
  const isText = item.type === 'text';
  const isFrame = item.type === 'frame';
  const set = (changes) => update(item.id, changes);
  const opacity = item.opacity ?? 100;
  const color = item.color || accentColor;

  const align = (mode) => ctx.align([item], mode);
  const centre = () => {
    const [h] = ctx.alignUpdates([item], 'center');
    const [v] = ctx.alignUpdates([item], 'middle');
    if (h || v) ctx.updateItems([{ ...h, ...v }]);
  };

  return [
    { type: 'header', label: isText ? `Text · ${FONT_NAMES[item.fontStyle] || 'Serif'} ${item.fontSize || 16}px` : itemName(item) },
    { label: isText ? 'Edit text…' : 'Edit properties…', icon: isText ? Type : Sliders, onSelect: editProperties },
    { label: 'Duplicate', icon: Copy, shortcut: 'Ctrl+D', onSelect: () => duplicate(item.id) },
    { label: item.locked ? 'Unlock' : 'Lock position', icon: item.locked ? Unlock : Lock, onSelect: () => set({ locked: !item.locked }) },
    { label: 'Copy style', icon: Paintbrush, onSelect: () => ctx.copyStyle(item) },
    { label: 'Paste style', icon: ClipboardPaste, disabled: !ctx.pasteStyle, onSelect: () => ctx.pasteStyle?.([item]) },
    { type: 'separator' },
    {
      label: 'Arrange', icon: Layers, submenu: [
        { label: 'Bring to front', icon: BringToFront, onSelect: () => move(item.id, 'to_front') },
        { label: 'Bring forward', icon: ArrowUp, onSelect: () => move(item.id, 'forward') },
        { label: 'Send backward', icon: ArrowDown, onSelect: () => move(item.id, 'backward') },
        { label: 'Send to back', icon: SendToBack, onSelect: () => move(item.id, 'to_back') },
      ],
    },
    {
      label: 'Position on page', icon: Crosshair, submenu: [
        { label: 'Centre horizontally', icon: AlignHorizontalJustifyCenter, onSelect: () => align('center') },
        { label: 'Centre vertically', icon: AlignVerticalJustifyCenter, onSelect: () => align('middle') },
        { label: 'Centre on page', icon: Crosshair, onSelect: centre },
        { type: 'separator' },
        { label: 'Left edge', icon: AlignStartVertical, onSelect: () => align('left') },
        { label: 'Right edge', icon: AlignEndVertical, onSelect: () => align('right') },
        { label: 'Top edge', icon: AlignStartHorizontal, onSelect: () => align('top') },
        { label: 'Bottom edge', icon: AlignEndHorizontal, onSelect: () => align('bottom') },
      ],
    },
    isText && {
      label: 'Text alignment', icon: AlignCenter, submenu: [
        { type: 'header', label: 'Horizontal' },
        { label: 'Left', icon: AlignLeft, checked: item.textAlign === 'left', onSelect: () => set({ textAlign: 'left' }) },
        { label: 'Centre', icon: AlignCenter, checked: (item.textAlign || 'center') === 'center', onSelect: () => set({ textAlign: 'center' }) },
        { label: 'Right', icon: AlignRight, checked: item.textAlign === 'right', onSelect: () => set({ textAlign: 'right' }) },
        { type: 'header', label: 'Vertical' },
        { label: 'Top', icon: ArrowUpToLine, checked: item.verticalAlign === 'top', onSelect: () => set({ verticalAlign: 'top' }) },
        { label: 'Middle', icon: AlignJustify, checked: (item.verticalAlign || 'middle') === 'middle', onSelect: () => set({ verticalAlign: 'middle' }) },
        { label: 'Bottom', icon: ArrowDownToLine, checked: item.verticalAlign === 'bottom', onSelect: () => set({ verticalAlign: 'bottom' }) },
      ],
    },
    isText && {
      label: 'Font', icon: CaseSensitive, submenu: [
        ...Object.entries(FONT_NAMES).map(([id, label]) => ({
          label, checked: (item.fontStyle || 'serif') === id, onSelect: () => set({ fontStyle: id }),
        })),
        { type: 'separator' },
        { label: `Larger (${(item.fontSize || 16) + 2}px)`, icon: Plus, keepOpen: true, onSelect: () => set({ fontSize: Math.min(120, (item.fontSize || 16) + 2) }) },
        { label: `Smaller (${Math.max(10, (item.fontSize || 16) - 2)}px)`, keepOpen: true, onSelect: () => set({ fontSize: Math.max(10, (item.fontSize || 16) - 2) }) },
        { type: 'separator' },
        { label: 'Italic', icon: Italic, checked: !!item.italic, onSelect: () => set({ italic: !item.italic }) },
        { label: 'Wider letter spacing', keepOpen: true, onSelect: () => set({ letterSpacing: Math.min(20, (item.letterSpacing || 0) + 1) }) },
        { label: 'Tighter letter spacing', keepOpen: true, onSelect: () => set({ letterSpacing: Math.max(-5, (item.letterSpacing || 0) - 1) }) },
      ],
    },
    isFrame && {
      label: 'Border thickness', icon: Square, submenu: [1, 2, 3, 4, 6, 8].map((t) => ({
        label: `${t}px`, checked: (item.thickness || 1) === t, onSelect: () => set({ thickness: t }),
      })),
    },
    (isText || isFrame) && {
      label: 'Colour', icon: Palette, submenu: [
        { type: 'custom', render: () => <ColorRow value={color} presets={presetColors} onChange={(c) => set({ color: c })} /> },
      ],
    },
    {
      label: `Opacity (${opacity}%)`, icon: Droplet, submenu: [100, 75, 50, 25].map((o) => ({
        label: `${o}%`, checked: opacity === o, onSelect: () => set({ opacity: o }),
      })),
    },
    {
      label: 'Rotate', icon: RotateCw, submenu: [
        { label: 'Rotate 90° right', icon: RotateCw, onSelect: () => set({ rotate: ((item.rotate || 0) + 90) % 360 }) },
        { label: 'Rotate 90° left', icon: RotateCcw, onSelect: () => set({ rotate: ((item.rotate || 0) + 270) % 360 }) },
        { label: 'Reset rotation', disabled: !item.rotate, onSelect: () => set({ rotate: 0 }) },
      ],
    },
    { type: 'separator' },
    { label: 'Delete', icon: Trash2, danger: true, shortcut: 'Del', onSelect: () => remove(item.id) },
  ].filter(Boolean);
}

/** Right-click menu when several elements are selected. */
export function buildSelectionMenu(items, ctx) {
  const ids = items.map((i) => i.id);
  const allLocked = items.every((i) => i.locked);
  return [
    { type: 'header', label: `${items.length} elements selected` },
    {
      label: 'Align', icon: AlignCenter, submenu: [
        { label: 'Left edges', icon: AlignStartVertical, onSelect: () => ctx.align(items, 'left') },
        { label: 'Centres', icon: AlignHorizontalJustifyCenter, onSelect: () => ctx.align(items, 'center') },
        { label: 'Right edges', icon: AlignEndVertical, onSelect: () => ctx.align(items, 'right') },
        { type: 'separator' },
        { label: 'Top edges', icon: AlignStartHorizontal, onSelect: () => ctx.align(items, 'top') },
        { label: 'Middles', icon: AlignVerticalJustifyCenter, onSelect: () => ctx.align(items, 'middle') },
        { label: 'Bottom edges', icon: AlignEndHorizontal, onSelect: () => ctx.align(items, 'bottom') },
      ],
    },
    {
      label: 'Distribute', icon: AlignHorizontalSpaceAround, disabled: items.length < 3, submenu: [
        { label: 'Horizontally', icon: AlignHorizontalSpaceAround, onSelect: () => ctx.distribute(items, 'horizontal') },
        { label: 'Vertically', icon: AlignVerticalSpaceAround, onSelect: () => ctx.distribute(items, 'vertical') },
      ],
    },
    { label: 'Paste style', icon: ClipboardPaste, disabled: !ctx.pasteStyle, onSelect: () => ctx.pasteStyle?.(items) },
    { label: allLocked ? 'Unlock all' : 'Lock all', icon: allLocked ? Unlock : Lock, onSelect: () => ctx.updateItems(ids.map((id) => ({ id, locked: !allLocked }))) },
    {
      label: 'Opacity', icon: Droplet, submenu: [100, 75, 50, 25].map((o) => ({
        label: `${o}%`, onSelect: () => ctx.updateItems(ids.map((id) => ({ id, opacity: o }))),
      })),
    },
    { type: 'separator' },
    { label: `Delete ${items.length} elements`, icon: Trash2, danger: true, shortcut: 'Del', onSelect: () => ctx.remove(ids) },
  ];
}

/** Right-click menu for empty canvas space: page-level adjustments. */
export function buildPageMenu(ctx) {
  const { design, addElement, updateDesign, openTab, presetColors } = ctx;
  return [
    { type: 'header', label: 'Page' },
    { label: 'Select all elements', icon: BoxSelect, shortcut: 'Ctrl+A', onSelect: ctx.selectAll },
    { label: 'Add element', icon: Plus, submenu: ELEMENT_KINDS.map((kind) => ({ label: kind.label, icon: kind.icon, onSelect: () => addElement(kind.id) })) },
    { type: 'separator' },
    {
      label: 'Accent colour', icon: Palette, submenu: [
        { type: 'custom', render: () => <ColorRow value={design.accentColor} presets={presetColors} onChange={(c) => updateDesign('accentColor', c)} /> },
      ],
    },
    { label: 'Change background…', icon: LayoutTemplate, onSelect: () => openTab('style') },
    { label: 'Remove background image', icon: ImageOff, disabled: !design.bgImage, onSelect: () => updateDesign('bgImage', null) },
    {
      label: 'Orientation', icon: design.orientation === 'landscape' ? RectangleHorizontal : RectangleVertical, submenu: [
        { label: 'Portrait', icon: RectangleVertical, checked: design.orientation !== 'landscape', onSelect: () => updateDesign('orientation', 'portrait') },
        { label: 'Landscape', icon: RectangleHorizontal, checked: design.orientation === 'landscape', onSelect: () => updateDesign('orientation', 'landscape') },
      ],
    },
    { label: 'Show frame', checked: design.frame?.visible !== false, onSelect: () => updateDesign('frame', { ...(design.frame || {}), visible: design.frame?.visible === false }) },
    { label: 'Show illustrations', checked: design.showIllustrations !== false, onSelect: () => updateDesign('showIllustrations', design.showIllustrations === false) },
    { type: 'separator' },
    { label: 'Show grid', icon: Grid3x3, checked: !!design.showGrid, onSelect: () => updateDesign('showGrid', !design.showGrid) },
    { label: 'Snap to grid', icon: Magnet, checked: !!design.snapToGrid, onSelect: () => updateDesign('snapToGrid', !design.snapToGrid) },
    { label: 'More layout options…', icon: Sliders, onSelect: () => openTab('layout') },
  ];
}
