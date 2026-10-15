import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, Reorder, motion, useDragControls } from 'framer-motion';
import { Check, CheckSquare, ChevronUp, GripVertical, ListChecks, PanelRightClose, PanelRightOpen, X } from 'lucide-react';
import Overlay from '../Overlay';
import Button from '../Button';
import { buttonClass } from '../buttonStyles';
import useRole, { useVisibleActions } from '../../hooks/useRole';

/**
 * The shared page side panel ("overview" panel) of AdminPageLayout. Pages pass
 * a `panel` config instead of building their own side columns, so every admin
 * page has the same shape: content on the left, panel on the right.
 *
 * The panel can hold a section switcher (only the active section's content is
 * rendered by the page), tools (e.g. the designer's style controls) or a list
 * (e.g. the seating chart's unassigned guests) — or any mix of these.
 *
 *   panel = {
 *     title, icon, subtitle?,
 *     items?: [{ id, label, description?, icon?, badge? (number), dot? (bool),
 *               group? (string: a heading shown before the first item of each group),
 *               muted? (bool: e.g. a hidden CMS section) }],
 *     activeId?, onChange?(id),
 *     onReorder?(ids)       — the list's items can be dragged (or moved with the
 *                             arrow keys on their handle) into a new order; called
 *                             with every reorderable id in the new order on drop.
 *                             Leave it out while a search narrows the list.
 *     bulkActions?: [{ id, label, icon, variant?, action | onClick(ids) }]
 *                           — adds a "Select" mode: tick items, then run an action
 *                             on all of them. `action` is a useBulkAdminAction
 *                             (run with the ids); selection clears when it succeeds.
 *     Items with `fixed: true` (e.g. an unsaved new item) stay first and can't be
 *     dragged or selected. Reordering and bulk actions are edits: viewers don't
 *     get them. Neither applies to grouped lists or the grid variant.
 *     navVariant?: 'list' (label + description rows) | 'grid' (compact tiles),
 *     content?: ReactNode   — tools/list shown under the switcher,
 *     footer?: ReactNode    — help text at the bottom (desktop only),
 *     sheetLabel?: string   — mobile button label when there's content,
 *     id?: string           — remembers collapsed/expanded per panel,
 *     defaultCollapsed?: bool, mobile?: bool (false: no mobile bar),
 *     rail?: ReactNode      — extra content for the collapsed rail,
 *   }
 *
 * Desktop (lg+): a card in a right-hand column that always fits the viewport:
 * its title stays put and only the links / content inside scroll, so a long
 * list never makes the page longer. It collapses to a slim icon rail
 * (remembered per panel) for more room.
 * Mobile: a bar under the header —
 *   - switcher only: a row of section chips (one tap to switch, always visible)
 *   - with content:  chips/button that open the panel as a bottom sheet, so the
 *     page itself (e.g. the invitation canvas) keeps the whole screen.
 *   - with reorder / bulk actions: a "manage" button beside the chips opens the
 *     full list in the bottom sheet, where items can be dragged and selected.
 */

function Badge({ item }) {
  if (item.badge > 0) {
    return (
      <span className="ml-auto shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#A67B5B]/15 text-[#8B5E3C] text-[11px] font-semibold flex items-center justify-center">
        {item.badge > 99 ? '99+' : item.badge}
      </span>
    );
  }
  if (item.dot) {
    return <span className="ml-auto shrink-0 w-2 h-2 rounded-full bg-amber-500" aria-label="Unsaved changes" />;
  }
  return null;
}

/** The section switcher. */
export function SidePanelNav({ panel, onPicked, selection, manage = {} }) {
  const { items = [], activeId, onChange, navVariant = 'list' } = panel;
  if (!items.length) return null;

  const pick = (id) => {
    onChange?.(id);
    onPicked?.(id);
  };

  if (navVariant === 'grid') {
    return (
      <div className={`grid gap-1 ${items.length <= 5 ? 'grid-cols-5' : 'grid-cols-4'}`} role="tablist" aria-label={panel.title}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => pick(item.id)}
              className={`relative flex flex-col items-center gap-1 py-2 px-0.5 rounded-xl text-[10px] font-semibold uppercase tracking-wide transition-colors border ${
                active
                  ? 'bg-[#A67B5B]/10 border-[#A67B5B]/30 text-[#8B5E3C]'
                  : 'border-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-700'
              }`}
            >
              {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
              {item.label}
              {(item.badge > 0 || item.dot) && <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-[#A67B5B]" />}
            </button>
          );
        })}
      </div>
    );
  }

  const listItems = items.map((item, index) => ({
    item,
    groupStart: item.group && item.group !== items[index - 1]?.group ? (index > 0 ? 'later' : 'first') : null,
  }));
  const fixed = listItems.filter(({ item }) => item.fixed);
  const movable = listItems.filter(({ item }) => !item.fixed);
  const selecting = !!selection?.selecting;
  const canReorder = !!manage.canReorder && !selecting && movable.length > 1;

  const row = ({ item, groupStart }, leading) => (
    <>
      {groupStart && (
        <p className={`px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400 ${groupStart === 'later' ? 'pt-3' : ''}`}>{item.group}</p>
      )}
      <ItemRow
        item={item}
        active={item.id === activeId}
        leading={leading}
        selecting={selecting && !item.fixed}
        checked={selecting && selection.isSelected(item.id)}
        onClick={() => (selecting && !item.fixed ? selection.toggle(item.id) : pick(item.id))}
      />
    </>
  );

  return (
    <nav aria-label={panel.title}>
      <ul className="space-y-0.5">
        {/* Fixed rows line up with the draggable ones (which have a handle). */}
        {fixed.map((entry) => <li key={entry.item.id} className={canReorder ? 'pl-6' : ''}>{row(entry)}</li>)}
      </ul>
      {canReorder ? (
        <ReorderableList entries={movable} onReorder={panel.onReorder} renderRow={row} />
      ) : (
        <ul className="space-y-0.5">
          {movable.map((entry) => <li key={entry.item.id}>{row(entry)}</li>)}
        </ul>
      )}
    </nav>
  );
}

/** One row of the list switcher (or a checkbox row in select mode). */
function ItemRow({ item, active, leading, selecting, checked, onClick }) {
  const Icon = item.icon;
  return (
    <div className="flex items-center gap-1">
      {leading}
      <button
        type="button"
        onClick={onClick}
        aria-current={!selecting && active ? 'true' : undefined}
        aria-pressed={selecting ? checked : undefined}
        className={`flex-1 min-w-0 text-left flex gap-3 p-2 rounded-xl transition-colors border ${
          selecting && checked
            ? 'bg-[#A67B5B]/[0.07] border-[#A67B5B]/30'
            : !selecting && active
              ? 'bg-[#A67B5B]/[0.07] border-[#A67B5B]/20'
              : 'border-transparent hover:bg-stone-50'
        }`}
      >
        {selecting && (
          <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
            checked ? 'bg-[#A67B5B] border-[#A67B5B] text-white' : 'border-stone-300 bg-white'}`} aria-hidden="true">
            {checked && <Check className="w-3 h-3" strokeWidth={3} />}
          </span>
        )}
        {Icon && (
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-white shadow-sm' : 'bg-stone-50'}`}>
            <Icon className={`w-4 h-4 ${active ? 'text-[#A67B5B]' : 'text-stone-500'}`} aria-hidden="true" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className={`text-sm font-medium truncate ${!selecting && active ? 'text-[#8B5E3C]' : item.muted ? 'text-stone-400' : 'text-stone-800'}`}>{item.label}</span>
            <Badge item={item} />
          </span>
          {item.description && <span className="block text-xs text-stone-500 leading-snug mt-0.5">{item.description}</span>}
        </span>
      </button>
    </div>
  );
}

/**
 * Drag (by the handle) to reorder; the handle also takes ArrowUp / ArrowDown.
 * Keeps its own order while dragging and reports it once, on drop.
 */
function ReorderableList({ entries, onReorder, renderRow }) {
  const ids = entries.map(({ item }) => item.id);
  const idsKey = ids.join('|');
  const [order, setOrderState] = useState(ids);
  const orderRef = useRef(ids);
  const setOrder = (next) => { orderRef.current = next; setOrderState(next); };
  // Follow outside changes (add, delete, refetch) when not mid-drag.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- idsKey summarises ids
  useEffect(() => setOrder(ids), [idsKey]);

  const commit = (next) => { if (next.join('|') !== idsKey) onReorder(next); };
  const moveBy = (id, step) => {
    const from = orderRef.current.indexOf(id);
    const to = from + step;
    if (from < 0 || to < 0 || to >= orderRef.current.length) return;
    const next = [...orderRef.current];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setOrder(next);
    commit(next);
  };

  const byId = Object.fromEntries(entries.map((entry) => [entry.item.id, entry]));
  return (
    <Reorder.Group as="ul" axis="y" values={order} onReorder={setOrder} className="space-y-0.5">
      {order.filter((id) => byId[id]).map((id) => (
        <DraggableRow key={id} entry={byId[id]} onDrop={() => commit(orderRef.current)} onMove={(step) => moveBy(id, step)} renderRow={renderRow} />
      ))}
    </Reorder.Group>
  );
}

function DraggableRow({ entry, onDrop, onMove, renderRow }) {
  const controls = useDragControls();
  const handle = (
    <button
      type="button"
      aria-label={`Reorder ${entry.item.label}`}
      title="Drag to reorder (or use the arrow keys)"
      onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          onMove(e.key === 'ArrowUp' ? -1 : 1);
        }
      }}
      className="shrink-0 w-5 py-2 flex justify-center rounded-md text-stone-300 hover:text-stone-500 focus-visible:text-[#A67B5B] cursor-grab active:cursor-grabbing touch-none"
    >
      <GripVertical className="w-4 h-4" aria-hidden="true" />
    </button>
  );
  return (
    <Reorder.Item value={entry.item.id} dragListener={false} dragControls={controls} onDragEnd={onDrop}
      className="relative bg-white rounded-xl" whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 1 }}>
      {renderRow(entry, handle)}
    </Reorder.Item>
  );
}

/** What the signed-in collaborator may do with the panel's list. */
function usePanelManage(panel) {
  const { canEdit } = useRole();
  const bulkActions = useVisibleActions(panel.bulkActions || []);
  const flatList = panel.items?.length > 0 && panel.navVariant !== 'grid' && !panel.items.some((item) => item.group);
  return {
    canReorder: canEdit && flatList && !!panel.onReorder,
    bulkActions: flatList ? bulkActions : [],
  };
}

/** Select mode for bulk actions. */
function useSelection(panel) {
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState([]);
  const selectable = (panel.items || []).filter((item) => !item.fixed).map((item) => item.id);
  // Items that went away (deleted, filtered out) drop out of the selection.
  const selected = picked.filter((id) => selectable.includes(id));
  const stop = () => { setSelecting(false); setPicked([]); };
  return {
    selecting,
    selected,
    selectable,
    start: () => setSelecting(true),
    stop,
    isSelected: (id) => selected.includes(id),
    toggle: (id) => setPicked((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])),
    toggleAll: () => setPicked(selected.length === selectable.length ? [] : selectable),
  };
}

function SelectToggle({ selection }) {
  if (selection.selecting) return null;
  return (
    <button type="button" onClick={selection.start} title="Select several"
      className="px-2 py-1 -my-1 rounded-lg text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-[#A67B5B] flex items-center gap-1">
      <CheckSquare className="w-3.5 h-3.5" aria-hidden="true" /> Select
    </button>
  );
}

/** Pinned under the list in select mode: count, select all, the actions, done. */
function BulkBar({ selection, actions }) {
  const { selected, selectable } = selection;
  const run = async (entry) => {
    const result = entry.action ? await entry.action.run(selected) : await entry.onClick?.(selected);
    if (result !== undefined) selection.stop();
  };
  return (
    <div className="shrink-0 p-3 border-t border-stone-100 bg-[#A67B5B]/[0.04] space-y-2" role="region" aria-label="Selected items">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium text-stone-700" aria-live="polite">{selected.length} selected</span>
        <button type="button" onClick={selection.toggleAll} className="text-[#8B5E3C] hover:underline">
          {selected.length === selectable.length && selectable.length > 0 ? 'Select none' : 'Select all'}
        </button>
        <button type="button" onClick={selection.stop} className="ml-auto px-2 py-1 rounded-lg font-medium text-stone-600 hover:bg-white">Done</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((entry) => (
          <Button key={entry.id} size="sm" variant={entry.variant || 'primary'} icon={entry.icon}
            disabled={!selected.length || entry.disabled} onClick={() => run(entry)}>
            {entry.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function PanelHeader({ panel, children }) {
  const Icon = panel.icon;
  return (
    <div className="flex items-start gap-2.5">
      {Icon && <Icon className="w-5 h-5 text-[#A67B5B] mt-0.5 shrink-0" aria-hidden="true" />}
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-medium text-stone-800 leading-tight">{panel.title}</h2>
        {panel.subtitle && <p className="text-xs text-stone-500 mt-0.5">{panel.subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const storageKey = (panel) => `admin.sidePanel.${panel.id || panel.title}`;

function readCollapsed(panel) {
  try {
    const saved = localStorage.getItem(storageKey(panel));
    if (saved) return saved === 'collapsed';
  } catch { /* storage unavailable */ }
  return !!panel.defaultCollapsed;
}

/** Desktop, collapsed: a slim rail with the switcher's icons. */
function SidePanelRail({ panel, onExpand }) {
  const Icon = panel.icon;
  return (
    <aside
      aria-label={panel.title}
      data-side-panel="collapsed"
      className="hidden lg:flex flex-col items-center gap-1.5 w-12 shrink-0 py-2 lg:sticky lg:top-20 self-start lg:max-h-[calc(100dvh-6.5rem)] overflow-y-auto scrollbar-hide bg-white rounded-2xl shadow-sm border border-stone-100"
    >
      <button type="button" onClick={onExpand} aria-label={`Show ${panel.title}`} title={`Show ${panel.title}`}
        className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-[#A67B5B]">
        <PanelRightOpen className="w-4 h-4" />
      </button>
      {Icon && !panel.items?.length && <Icon className="w-4 h-4 text-[#A67B5B] my-1" aria-hidden="true" />}
      {panel.items?.map((item) => {
        const ItemIcon = item.icon;
        const active = item.id === panel.activeId;
        return (
          <button key={item.id} type="button" onClick={() => panel.onChange?.(item.id)}
            aria-label={item.label} title={item.label} aria-current={active ? 'true' : undefined}
            className={`relative p-2 rounded-lg ${active ? 'bg-[#A67B5B]/10 text-[#A67B5B]' : 'text-stone-500 hover:bg-stone-100'}`}>
            {ItemIcon ? <ItemIcon className="w-4 h-4" /> : item.label.slice(0, 2)}
            {(item.badge > 0 || item.dot) && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#A67B5B]" />}
          </button>
        );
      })}
      {panel.rail}
    </aside>
  );
}

/** Desktop: the right-hand column (or its collapsed rail). */
export function SidePanelAside({ panel }) {
  const [collapsed, setCollapsed] = useState(() => readCollapsed(panel));
  const manage = usePanelManage(panel);
  const selection = useSelection(panel);
  const toggle = (next) => {
    setCollapsed(next);
    try { localStorage.setItem(storageKey(panel), next ? 'collapsed' : 'expanded'); } catch { /* storage unavailable */ }
  };

  if (collapsed) return <SidePanelRail panel={panel} onExpand={() => toggle(false)} />;
  const hasListNav = panel.items?.length > 0 && panel.navVariant !== 'grid';

  return (
    <aside
      aria-label={panel.title}
      data-side-panel
      className="hidden lg:flex flex-col w-80 xl:w-[22rem] shrink-0 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6.5rem)] fit:max-h-full self-start fit:self-stretch bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden"
    >
      {/* Pinned: title (and a compact tab grid, which is a toolbar, not a list) */}
      <div className="shrink-0 p-4 pb-3 space-y-3 border-b border-stone-100">
        <PanelHeader panel={panel}>
          {manage.bulkActions.length > 0 && <SelectToggle selection={selection} />}
          <button type="button" onClick={() => toggle(true)} aria-label={`Hide ${panel.title}`} title="Collapse panel"
            className="p-1.5 -m-1 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600">
            <PanelRightClose className="w-4 h-4" />
          </button>
        </PanelHeader>
        {panel.navVariant === 'grid' && <SidePanelNav panel={panel} />}
      </div>
      {/* Scrolls: the links and any tools/list */}
      {(hasListNav || panel.content) && (
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-4">
          {hasListNav && <SidePanelNav panel={panel} manage={manage} selection={selection} />}
          {panel.content && <div className="px-1">{panel.content}</div>}
        </div>
      )}
      {selection.selecting && <BulkBar selection={selection} actions={manage.bulkActions} />}
      {panel.footer && !selection.selecting && <div className="shrink-0 p-4 pt-3 border-t border-stone-100 bg-[#A67B5B]/[0.03]">{panel.footer}</div>}
    </aside>
  );
}

/** Mobile: section chips that keep the active one scrolled into view. */
function ChipRow({ panel, onPicked, className = '-mx-4 px-4' }) {
  const rowRef = useRef(null);
  const { items = [], activeId, onChange } = panel;

  useEffect(() => {
    const el = rowRef.current?.querySelector('[aria-current="true"]');
    el?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeId]);

  return (
    <div ref={rowRef} className={`flex gap-2 overflow-x-auto scrollbar-hide py-0.5 snap-x ${className}`} aria-label={panel.title} role="navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? 'true' : undefined}
            onClick={() => { onChange?.(item.id); onPicked?.(item.id); }}
            className={`${buttonClass({ variant: active ? 'secondary' : 'primary', size: 'sm' })} snap-start shrink-0 !rounded-full relative`}
          >
            {Icon && <Icon aria-hidden="true" />}
            <span className={`max-w-[14rem] truncate ${item.muted && !active ? 'opacity-60' : ''}`}>{item.label}</span>
            {(item.badge > 0 || item.dot) && (
              <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-[#A67B5B]'}`} aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Mobile: the panel as a bottom sheet (drag the handle down or tap outside to
 * close). `manage` shows the full list, where items can be dragged and
 * selected; otherwise the sections are chips above the panel's content.
 */
function BottomSheet({ panel, manage, onClose }) {
  const dragControls = useDragControls();
  const selection = useSelection(panel);
  return (
    <Overlay onClose={onClose} className="flex items-end justify-center" backdropClassName="bg-black/25" zIndex={60}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={panel.title}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        // Dragging starts only from the header, so lists inside still scroll.
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => { if (info.offset.y > 90 || info.velocity.y > 500) onClose(); }}
        className="w-full max-h-[78dvh] bg-white rounded-t-3xl shadow-2xl flex flex-col pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 pt-2 pb-3 px-4 space-y-3 border-b border-stone-100 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={(e) => dragControls.start(e)}>
          <div className="mx-auto w-10 h-1.5 rounded-full bg-stone-200" aria-hidden="true" />
          <PanelHeader panel={panel}>
            {manage && manage.bulkActions.length > 0 && <SelectToggle selection={selection} />}
            <button type="button" onClick={onClose} aria-label="Close panel" className="p-1.5 -m-1 rounded-lg text-stone-500 hover:bg-stone-100">
              <X className="w-5 h-5" />
            </button>
          </PanelHeader>
          {!manage && panel.items?.length > 0 && <ChipRow panel={panel} />}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4">
          {manage && <SidePanelNav panel={panel} manage={manage} selection={selection} onPicked={onClose} />}
          {panel.content}
        </div>
        {manage && selection.selecting && <BulkBar selection={selection} actions={manage.bulkActions} />}
      </motion.div>
    </Overlay>
  );
}

/** Mobile: the bar under the header (chips, or a button that opens the sheet). */
export function SidePanelMobileBar({ panel }) {
  const [sheet, setSheet] = useState(null); // null | 'content' | 'manage'
  const manage = usePanelManage(panel);
  const hasContent = !!panel.content;
  const hasItems = panel.items?.length > 0;
  const manageable = manage.canReorder || manage.bulkActions.length > 0;
  const Icon = panel.icon;

  return (
    <div className="lg:hidden sticky top-16 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-[#FFF9F5]/95 backdrop-blur border-b border-[#A67B5B]/10">
      {hasItems && (
        <div className="flex items-center gap-2">
          <ChipRow panel={panel} className={manageable ? 'flex-1 min-w-0 -ml-4 pl-4 pr-1' : '-mx-4 px-4 flex-1 min-w-0'}
            onPicked={hasContent ? () => setSheet('content') : undefined} />
          {manageable && (
            <Button size="icon-sm" icon={ListChecks} aria-label={`Arrange or select ${panel.title.toLowerCase()}`}
              title="Arrange / select" aria-haspopup="dialog" onClick={() => setSheet('manage')} />
          )}
        </div>
      )}
      {hasContent && !hasItems && (
        <button
          type="button"
          onClick={() => setSheet('content')}
          className={`${buttonClass({ variant: 'primary', size: 'sm', fullWidth: true })} !justify-between`}
          aria-haspopup="dialog"
        >
          <span className="flex items-center gap-2 min-w-0">
            {Icon && <Icon aria-hidden="true" />}
            <span className="truncate">{panel.sheetLabel || panel.title}</span>
          </span>
          <ChevronUp aria-hidden="true" />
        </button>
      )}
      <AnimatePresence>
        {sheet && (hasContent || sheet === 'manage') && (
          <BottomSheet panel={panel} manage={sheet === 'manage' ? manage : null} onClose={() => setSheet(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
