import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import {
  ChevronDown, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Copy, Pencil, Trash2, Plus, GripVertical, Check,
} from 'lucide-react';
import useDismiss from '../../hooks/useDismiss';
import Button from '../Button';

const pageLabel = (page, index) => (page?.name && page.name.trim()) || `Page ${index + 1}`;

/**
 * Compact page switcher for the invitation designer toolbar: prev/next arrows
 * around a dropdown that lists every page, where pages can be opened,
 * renamed (double-click or ✎), moved, dragged to reorder, duplicated, deleted
 * or added.
 */
export default function InvitationPageMenu({
  pages,
  currentPage,
  onGoTo,
  onAdd,
  onDuplicate,
  onDelete,
  onMove,
  onReorder,
  onRename,
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const ref = useRef(null);
  const close = useCallback(() => { setOpen(false); setEditingId(null); }, []);
  useDismiss(ref, open, close);

  const total = pages.length;
  const startRename = (page, index) => { setEditingId(page.id); setDraft(page.name || `Page ${index + 1}`); };
  const commitRename = (index) => { onRename(index, draft); setEditingId(null); };

  return (
    <div className="flex items-center gap-0.5" ref={ref}>
      <Button size="icon" icon={ChevronLeft} onClick={() => onGoTo(currentPage - 1)} disabled={currentPage <= 0} title="Previous page" aria-label="Previous page" />

      <div className="relative">
        <Button
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          title="Pages — switch, reorder, rename"
        >
          <span className="max-w-[7.5rem] truncate">{pageLabel(pages[currentPage], currentPage)}</span>
          <span className="text-[11px] font-bold text-stone-400">{currentPage + 1}/{total}</span>
          <ChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>

        <AnimatePresence>
          {open && (
            <motion.div
              role="menu"
              aria-label="Pages"
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-stone-100 p-2"
            >
              <p className="px-2 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Pages · drag to reorder
              </p>
              <Reorder.Group
                axis="y"
                values={pages.map((p) => p.id)}
                onReorder={onReorder}
                className="max-h-[45vh] overflow-y-auto space-y-1"
              >
                {pages.map((page, index) => {
                  const active = index === currentPage;
                  const editing = editingId === page.id;
                  return (
                    <Reorder.Item
                      key={page.id}
                      value={page.id}
                      dragListener={!editing}
                      className={`group flex items-center gap-1 rounded-xl px-1.5 py-1 ${active ? 'bg-[#A67B5B]/10' : 'hover:bg-stone-50'}`}
                    >
                      <GripVertical className="w-4 h-4 text-stone-300 cursor-grab active:cursor-grabbing shrink-0" aria-hidden="true" />
                      {editing ? (
                        <input
                          autoFocus
                          value={draft}
                          maxLength={40}
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={() => commitRename(index)}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') { e.preventDefault(); commitRename(index); }
                            else if (e.key === 'Escape') setEditingId(null);
                          }}
                          aria-label={`Rename page ${index + 1}`}
                          className="flex-1 min-w-0 px-2 py-1 rounded-lg text-sm outline-none ring-1 ring-[#A67B5B]"
                        />
                      ) : (
                        <button
                          type="button"
                          role="menuitemradio"
                          aria-checked={active}
                          onClick={() => { onGoTo(index); close(); }}
                          onDoubleClick={() => startRename(page, index)}
                          className="flex-1 min-w-0 flex items-center gap-2 px-1.5 py-1 text-left text-sm"
                        >
                          <span className="w-5 text-[11px] font-bold text-stone-400">{index + 1}</span>
                          <span className={`truncate ${active ? 'font-semibold text-[#8B5E3C]' : 'text-stone-700'}`}>{pageLabel(page, index)}</span>
                          {active && <Check className="w-3.5 h-3.5 text-[#A67B5B] shrink-0" />}
                        </button>
                      )}
                      <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 group-focus-within:opacity-100">
                        <Button size="icon-sm" icon={ArrowUp} onClick={() => onMove(index, -1)} disabled={index === 0} aria-label={`Move ${pageLabel(page, index)} up`} title="Move up" />
                        <Button size="icon-sm" icon={ArrowDown} onClick={() => onMove(index, 1)} disabled={index === total - 1} aria-label={`Move ${pageLabel(page, index)} down`} title="Move down" />
                        <Button size="icon-sm" icon={Pencil} onClick={() => startRename(page, index)} aria-label={`Rename ${pageLabel(page, index)}`} title="Rename" />
                        <Button size="icon-sm" icon={Copy} onClick={() => onDuplicate(index)} aria-label={`Duplicate ${pageLabel(page, index)}`} title="Duplicate" />
                        <Button
                          size="icon-sm"
                          variant="danger"
                          icon={Trash2}
                          onClick={() => onDelete(index)}
                          disabled={total <= 1}
                          aria-label={`Delete ${pageLabel(page, index)}`}
                          title="Delete"
                        />
                      </div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
              <Button
                icon={Plus}
                fullWidth
                onClick={() => { onAdd(); close(); }}
                className="mt-2"
              >
                Add page
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Button size="icon" icon={ChevronRight} onClick={() => onGoTo(currentPage + 1)} disabled={currentPage >= total - 1} title="Next page" aria-label="Next page" />
    </div>
  );
}
