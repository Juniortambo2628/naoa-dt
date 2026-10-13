import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, ChevronDown } from 'lucide-react';
import useDismiss from '../../hooks/useDismiss';
import { ELEMENT_KINDS } from './invitationElements';

/** "Add" dropdown in the designer toolbar for inserting page elements. */
export default function InvitationAddMenu({ onAdd }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium text-[#4A3F35] bg-white/80 border border-stone-200/60 hover:bg-white"
        title="Add an element to this page"
      >
        <Plus className="w-4 h-4 text-[#A67B5B]" />
        <span className="hidden sm:inline">Add</span>
        <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-3 w-52 bg-white rounded-2xl shadow-2xl border border-stone-100 py-1.5"
          >
            {ELEMENT_KINDS.map((kind) => (
              <button
                key={kind.id}
                type="button"
                role="menuitem"
                onClick={() => { onAdd(kind.id); close(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-700 hover:bg-[#FAF7F2] focus:bg-[#FAF7F2] outline-none"
              >
                <kind.icon className="w-4 h-4 text-[#A67B5B]" />
                {kind.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
