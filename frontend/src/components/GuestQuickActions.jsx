import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, MapPin, Plane, Armchair, Camera } from 'lucide-react';
import Modal from './Modal';
import TabbedTwoColumn from './TabbedTwoColumn';
import GuestLocationPicker from './GuestLocationPicker';
import GuestTravelForm from './GuestTravelForm';
import PublicSeatingChart from './PublicSeatingChart';
import GuestPolaroidCapture from './GuestPolaroidCapture';

// The three guest tools, surfaced through one shared tabbed modal dialog.
const ACTIONS = [
  {
    id: 'location',
    label: 'Where are you',
    icon: MapPin,
    gradient: 'from-[#A67B5B] to-[#C8A68E]',
  },
  {
    id: 'travel',
    label: 'My travel details',
    icon: Plane,
    gradient: 'from-blue-400 to-blue-500',
  },
  {
    id: 'seating',
    label: 'Seating chart',
    icon: Armchair,
    gradient: 'from-[#A67B5B] to-[#C8A68E]',
  },
  {
    id: 'polaroid',
    label: 'Snap a polaroid',
    icon: Camera,
    gradient: 'from-[#A67B5B] to-[#C8A68E]',
  },
];

// Remember whether the guest has opened the menu before, so the attention
// pulse only nudges first-time visitors instead of looping forever.
const SEEN_KEY = 'guestQuickActionsSeen';

export default function GuestQuickActions({ guestCode }) {
  const [open, setOpen] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(true);

  useEffect(() => {
    try {
      setHasInteracted(localStorage.getItem(SEEN_KEY) === 'true');
    } catch {
      setHasInteracted(false);
    }
  }, []);

  const isModalOpen = activeAction !== null;

  const markSeen = () => {
    setHasInteracted(true);
    try {
      localStorage.setItem(SEEN_KEY, 'true');
    } catch {
      // Ignore storage failures (private mode, etc.) — the menu still works.
    }
  };

  const toggleOpen = () => {
    setOpen((v) => !v);
    markSeen();
  };

  const handleSelect = (id) => {
    setActiveAction(id);
    setOpen(false);
  };

  // Nudge first-time visitors: pulse the button while it's still collapsed.
  const showPulse = !open && !hasInteracted;

  const renderModalBody = (item) => {
    switch (item?.id) {
      case 'location':
        return <GuestLocationPicker guestCode={guestCode} />;
      case 'travel':
        return <GuestTravelForm guestCode={guestCode} />;
      case 'seating':
        return <PublicSeatingChart guestCode={guestCode} showExpand={false} />;
      case 'polaroid':
        return <GuestPolaroidCapture guestCode={guestCode} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Floating quick-actions widget */}
      <div className="fixed bottom-6 right-6 z-[9990] flex flex-col items-end gap-3">
        <AnimatePresence>
          {open &&
            ACTIONS.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  type="button"
                  initial={{ opacity: 0, y: 12, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.8 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleSelect(action.id)}
                  className="group flex items-center gap-3"
                >
                  <span className="px-3 py-1.5 rounded-lg bg-white shadow-md border border-stone-100 text-sm font-medium text-stone-700 whitespace-nowrap">
                    {action.label}
                  </span>
                  <span
                    className={`w-11 h-11 rounded-full bg-gradient-to-br ${action.gradient} text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                </motion.button>
              );
            })}
        </AnimatePresence>

        {/* Main trigger with an always-visible "Quick actions" label */}
        <div className="flex items-center gap-2.5">
          <AnimatePresence>
            {!open && (
              <motion.span
                key="qa-label"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                aria-hidden="true"
                className="px-3.5 py-2 rounded-full bg-white shadow-lg border border-[#A67B5B]/25 text-sm font-semibold text-[#8C6A4D] whitespace-nowrap"
              >
                Quick actions
              </motion.span>
            )}
          </AnimatePresence>

          <div className="relative flex items-center justify-center">
            {/* One-time attention pulse for first-time visitors. */}
            {showPulse && (
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-[#A67B5B]"
                initial={{ opacity: 0.45, scale: 1 }}
                animate={{ opacity: 0, scale: 1.8 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
              />
            )}

            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              animate={showPulse ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={showPulse ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
              onClick={toggleOpen}
              aria-label={open ? 'Close quick actions' : 'Open quick actions'}
              aria-expanded={open}
              className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#A67B5B] to-[#8C6A4D] text-white flex items-center justify-center shadow-xl shadow-[#A67B5B]/40 ring-4 ring-white/70 hover:scale-105 transition-transform"
            >
              <motion.span animate={{ rotate: open ? 135 : 0 }} transition={{ duration: 0.2 }}>
                {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </motion.span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Shared tabbed modal dialog for all three actions */}
      <Modal
        open={isModalOpen}
        onClose={() => setActiveAction(null)}
        maxWidth="5xl"
        label="Quick actions"
      >
        <TabbedTwoColumn
          title="Quick actions"
          items={ACTIONS}
          activeId={activeAction}
          onChange={setActiveAction}
          renderContent={renderModalBody}
        />
      </Modal>
    </>
  );
}
