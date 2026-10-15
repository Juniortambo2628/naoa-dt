import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronUp, PanelRightClose, PanelRightOpen, X } from 'lucide-react';
import Overlay from '../Overlay';
import { buttonClass } from '../buttonStyles';

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
 *     items?: [{ id, label, description?, icon?, badge? (number), dot? (bool) }],
 *     activeId?, onChange?(id),
 *     navVariant?: 'list' (label + description rows) | 'grid' (compact tiles),
 *     content?: ReactNode   — tools/list shown under the switcher,
 *     footer?: ReactNode    — help text at the bottom (desktop only),
 *     sheetLabel?: string   — mobile button label when there's content,
 *     id?: string           — remembers collapsed/expanded per panel,
 *     defaultCollapsed?: bool, mobile?: bool (false: no mobile bar),
 *     rail?: ReactNode      — extra content for the collapsed rail,
 *   }
 *
 * Desktop (lg+): a card in a right-hand column, sticky and scrolling on its own;
 * it collapses to a slim icon rail (remembered per panel) for more room.
 * Mobile: a bar under the header —
 *   - switcher only: a row of section chips (one tap to switch, always visible)
 *   - with content:  chips/button that open the panel as a bottom sheet, so the
 *     page itself (e.g. the invitation canvas) keeps the whole screen.
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
export function SidePanelNav({ panel, onPicked }) {
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

  return (
    <nav aria-label={panel.title}>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => pick(item.id)}
                aria-current={active ? 'true' : undefined}
                className={`w-full text-left flex gap-3 p-2 rounded-xl transition-colors border ${
                  active
                    ? 'bg-[#A67B5B]/[0.07] border-[#A67B5B]/20'
                    : 'border-transparent hover:bg-stone-50'
                }`}
              >
                {Icon && (
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-white shadow-sm' : 'bg-stone-50'}`}>
                    <Icon className={`w-4 h-4 ${active ? 'text-[#A67B5B]' : 'text-stone-500'}`} aria-hidden="true" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={`text-sm font-medium truncate ${active ? 'text-[#8B5E3C]' : 'text-stone-800'}`}>{item.label}</span>
                    <Badge item={item} />
                  </span>
                  {item.description && <span className="block text-xs text-stone-500 leading-snug mt-0.5">{item.description}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
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
      className="hidden lg:flex flex-col items-center gap-1.5 w-12 shrink-0 py-2 lg:sticky lg:top-20 self-start bg-white rounded-2xl shadow-sm border border-stone-100"
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
  const toggle = (next) => {
    setCollapsed(next);
    try { localStorage.setItem(storageKey(panel), next ? 'collapsed' : 'expanded'); } catch { /* storage unavailable */ }
  };

  if (collapsed) return <SidePanelRail panel={panel} onExpand={() => toggle(false)} />;

  return (
    <aside
      aria-label={panel.title}
      data-side-panel
      className="hidden lg:flex flex-col w-80 xl:w-[22rem] shrink-0 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] fit:max-h-full self-start fit:self-stretch bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden"
    >
      <div className="shrink-0 p-4 pb-3 space-y-3 border-b border-stone-100">
        <PanelHeader panel={panel}>
          <button type="button" onClick={() => toggle(true)} aria-label={`Hide ${panel.title}`} title="Collapse panel"
            className="p-1.5 -m-1 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600">
            <PanelRightClose className="w-4 h-4" />
          </button>
        </PanelHeader>
        <SidePanelNav panel={panel} />
      </div>
      {panel.content && <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4">{panel.content}</div>}
      {panel.footer && <div className="shrink-0 p-4 pt-3 border-t border-stone-100 bg-[#A67B5B]/[0.03]">{panel.footer}</div>}
    </aside>
  );
}

/** Mobile: section chips that keep the active one scrolled into view. */
function ChipRow({ panel, onPicked }) {
  const rowRef = useRef(null);
  const { items = [], activeId, onChange } = panel;

  useEffect(() => {
    const el = rowRef.current?.querySelector('[aria-current="true"]');
    el?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeId]);

  return (
    <div ref={rowRef} className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 py-0.5 snap-x" aria-label={panel.title} role="navigation">
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
            {item.label}
            {(item.badge > 0 || item.dot) && (
              <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-[#A67B5B]'}`} aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Mobile: the panel as a bottom sheet (drag the handle down or tap outside to close). */
function BottomSheet({ panel, onClose }) {
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
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => { if (info.offset.y > 90 || info.velocity.y > 500) onClose(); }}
        className="w-full max-h-[78dvh] bg-white rounded-t-3xl shadow-2xl flex flex-col pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 pt-2 pb-3 px-4 space-y-3 border-b border-stone-100 cursor-grab active:cursor-grabbing">
          <div className="mx-auto w-10 h-1.5 rounded-full bg-stone-200" aria-hidden="true" />
          <PanelHeader panel={panel}>
            <button type="button" onClick={onClose} aria-label="Close panel" className="p-1.5 -m-1 rounded-lg text-stone-500 hover:bg-stone-100">
              <X className="w-5 h-5" />
            </button>
          </PanelHeader>
          {panel.items?.length > 0 && <ChipRow panel={panel} />}
        </div>
        {/* Dragging starts only from the header, so lists inside still scroll. */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4" onPointerDownCapture={(e) => e.stopPropagation()}>
          {panel.content}
        </div>
      </motion.div>
    </Overlay>
  );
}

/** Mobile: the bar under the header (chips, or a button that opens the sheet). */
export function SidePanelMobileBar({ panel }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasContent = !!panel.content;
  const hasItems = panel.items?.length > 0;
  const Icon = panel.icon;

  return (
    <div className="lg:hidden sticky top-16 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-[#FFF9F5]/95 backdrop-blur border-b border-[#A67B5B]/10">
      {hasItems && (
        <ChipRow panel={panel} onPicked={hasContent ? () => setSheetOpen(true) : undefined} />
      )}
      {hasContent && !hasItems && (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
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
        {sheetOpen && hasContent && <BottomSheet panel={panel} onClose={() => setSheetOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
