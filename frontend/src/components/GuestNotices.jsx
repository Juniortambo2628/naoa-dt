import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronDown, UserX, Baby, Gift, Shirt } from 'lucide-react';
import { visibleGuestNotices } from '../utils/guestNotices';

// Icon per default notice (custom notices fall back to Info).
const NOTICE_ICONS = {
  invite: UserX,
  kids: Baby,
  gifts: Gift,
  dress: Shirt,
};

// The hero clips its overflow, so the "hero" variant is anchored inside the
// section and scrolls away with it; "floating" stays pinned to the viewport.
const POSITION = {
  hero: 'absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 z-30',
  floating: 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9980]',
};

/**
 * Floating cluster of informational guest notices (plus-ones, kids, gifts,
 * dress code…). Content comes from the public `guest_notices` setting,
 * edited in Admin → Settings → Guest Notices; renders nothing when every
 * notice is switched off. Chips stay compact so they fit one line on
 * desktop; small screens start collapsed so only the toggle shows.
 */
export default function GuestNotices({ notices, variant = 'floating' }) {
  const [open, setOpen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  );
  const items = useMemo(() => visibleGuestNotices(notices), [notices]);

  if (!items.length) return null;

  return (
    <div
      className={`${POSITION[variant] || POSITION.floating} w-[min(96vw,56rem)] flex flex-col items-center gap-1.5 md:gap-2`}
      data-testid="guest-notices"
    >
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            key="chips"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-wrap justify-center gap-1.5 md:gap-2"
          >
            {items.map((notice) => {
              const Icon = NOTICE_ICONS[notice.icon] || Info;
              return (
                <li key={notice.id}>
                  <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-palette-light-brown/50 shadow-soft text-[11px] font-medium text-stone-700">
                    <Icon className="w-3 h-3 text-palette-cinnamon" aria-hidden="true" />
                    {notice.text}
                  </span>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label={open ? 'Hide guest notices' : 'Show guest notices'}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-palette-light-brown/40 text-[11px] font-semibold text-palette-cinnamon shadow-sm hover:bg-white transition-colors"
      >
        <Info className="w-3.5 h-3.5" aria-hidden="true" />
        Good to know
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? '' : 'rotate-180'}`} aria-hidden="true" />
      </button>
    </div>
  );
}
