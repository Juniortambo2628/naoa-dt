import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronRight } from 'lucide-react';

const MARGIN = 8;

/** Keep a menu of `size` inside the viewport, flipping left/up when needed. */
function placeWithin(x, y, size, anchorWidth = 0) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = x;
  let top = y;
  if (left + size.width > vw - MARGIN) left = Math.max(MARGIN, x - size.width - anchorWidth);
  if (top + size.height > vh - MARGIN) top = Math.max(MARGIN, vh - size.height - MARGIN);
  return { left, top };
}

const focusables = (el) => [...(el?.querySelectorAll(':scope > [role="menuitem"], :scope > [role="menuitemcheckbox"], :scope > [role="menuitemradio"]') || [])]
  .filter((b) => !b.disabled);

function MenuList({ items, x, y, anchorWidth = 0, onClose, autoFocus = true, onRequestCloseSub, depth = 0 }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });
  const [openSub, setOpenSub] = useState(null); // { index, x, y, width }

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setPos(placeWithin(x, y, { width: el.offsetWidth, height: el.offsetHeight }, anchorWidth));
  }, [x, y, anchorWidth, items]);

  useEffect(() => {
    if (autoFocus) focusables(ref.current)[0]?.focus();
  }, [autoFocus]);

  const openSubmenu = (index, target) => {
    const rect = target.getBoundingClientRect();
    setOpenSub({ index, x: rect.right - 4, y: rect.top - 6, width: rect.width });
  };

  const onKeyDown = (e) => {
    const list = focusables(ref.current);
    const i = list.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); list[(i + 1) % list.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); list[(i - 1 + list.length) % list.length]?.focus(); }
    else if (e.key === 'ArrowLeft' && depth > 0) { e.preventDefault(); e.stopPropagation(); onRequestCloseSub?.(); }
    else if (e.key === 'ArrowRight') {
      const index = Number(document.activeElement?.dataset?.index);
      if (items[index]?.submenu) { e.preventDefault(); e.stopPropagation(); openSubmenu(index, document.activeElement); }
    }
  };

  return (
    <>
      <div
        ref={ref}
        role="menu"
        onKeyDown={onKeyDown}
        onContextMenu={(e) => e.preventDefault()}
        className="fixed z-[200] min-w-[13rem] max-w-[18rem] max-h-[80vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-stone-100 py-1.5 text-sm"
        style={{ left: pos.left, top: pos.top }}
      >
        {items.map((item, index) => {
          if (!item || item.hidden) return null;
          if (item.type === 'separator') return <div key={`sep-${index}`} role="separator" className="my-1 border-t border-stone-100" />;
          if (item.type === 'header') {
            return (
              <div key={`h-${index}`} className="px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 truncate">
                {item.label}
              </div>
            );
          }
          if (item.type === 'custom') {
            return <div key={item.id || index} className="px-3 py-1.5" onMouseEnter={() => setOpenSub(null)}>{item.render()}</div>;
          }
          const Icon = item.icon;
          const role = item.checked !== undefined ? 'menuitemcheckbox' : 'menuitem';
          return (
            <button
              key={item.id || index}
              type="button"
              role={role}
              aria-checked={item.checked !== undefined ? !!item.checked : undefined}
              aria-haspopup={item.submenu ? 'menu' : undefined}
              aria-expanded={item.submenu ? openSub?.index === index : undefined}
              data-index={index}
              disabled={item.disabled}
              onMouseEnter={(e) => (item.submenu ? openSubmenu(index, e.currentTarget) : setOpenSub(null))}
              onClick={(e) => {
                if (item.submenu) { openSubmenu(index, e.currentTarget); return; }
                item.onSelect?.();
                if (!item.keepOpen) onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                item.danger ? 'text-red-600 hover:bg-red-50 focus:bg-red-50' : 'text-stone-700 hover:bg-[#FAF7F2] focus:bg-[#FAF7F2]'
              } ${openSub?.index === index ? 'bg-[#FAF7F2]' : ''}`}
            >
              <span className="w-4 flex justify-center shrink-0">
                {item.checked ? <Check className="w-4 h-4 text-[#A67B5B]" /> : Icon ? <Icon className={`w-4 h-4 ${item.danger ? '' : 'text-[#A67B5B]'}`} /> : null}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.shortcut && <span className="text-[11px] text-stone-400">{item.shortcut}</span>}
              {item.submenu && <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
            </button>
          );
        })}
      </div>
      {openSub && items[openSub.index]?.submenu && (
        <MenuList
          key={openSub.index}
          items={items[openSub.index].submenu}
          x={openSub.x}
          y={openSub.y}
          anchorWidth={openSub.width}
          depth={depth + 1}
          onClose={onClose}
          onRequestCloseSub={() => {
            const trigger = ref.current?.querySelector(`[data-index="${openSub.index}"]`);
            setOpenSub(null);
            trigger?.focus();
          }}
        />
      )}
    </>
  );
}

/**
 * ContextMenu — a right-click menu rendered at viewport coordinates, with
 * nested submenus (hover or →), arrow-key navigation, and Escape / outside
 * click to close.
 *
 * @param {{ x: number, y: number } | null} position - Where to open; null = closed
 * @param {Array} items - [{ label, icon, onSelect, disabled, danger, checked,
 *   shortcut, keepOpen, submenu: items[] } | { type: 'separator' }
 *   | { type: 'header', label } | { type: 'custom', render: () => node }]
 * @param {function} onClose
 */
export default function ContextMenu({ position, items, onClose }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!position) return undefined;
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onScroll = (e) => { if (!rootRef.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [position, onClose]);

  if (!position || typeof document === 'undefined') return null;

  return createPortal(
    <div ref={rootRef}>
      <MenuList items={items} x={position.x} y={position.y} onClose={onClose} />
    </div>,
    document.body
  );
}
