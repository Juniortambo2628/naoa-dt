import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, MapPin, Plane, Armchair } from 'lucide-react';
import Modal from './Modal';
import GuestLocationPicker from './GuestLocationPicker';
import GuestTravelForm from './GuestTravelForm';
import PublicSeatingChart from './PublicSeatingChart';

// The three guest tools, surfaced through one shared modal dialog.
const ACTIONS = [
  {
    id: 'location',
    label: 'Where are you',
    icon: MapPin,
    gradient: 'from-[#A67B5B] to-[#C8A68E]',
    maxWidth: 'lg',
  },
  {
    id: 'travel',
    label: 'My travel details',
    icon: Plane,
    gradient: 'from-blue-400 to-blue-500',
    maxWidth: 'lg',
  },
  {
    id: 'seating',
    label: 'Seating chart',
    icon: Armchair,
    gradient: 'from-[#A67B5B] to-[#C8A68E]',
    maxWidth: '3xl',
  },
];

export default function GuestQuickActions({ guestCode }) {
  const [open, setOpen] = useState(false);
  const [activeAction, setActiveAction] = useState(null);

  const active = ACTIONS.find((a) => a.id === activeAction) || null;

  const handleSelect = (id) => {
    setActiveAction(id);
    setOpen(false);
  };

  const renderModalBody = () => {
    switch (activeAction) {
      case 'location':
        return <GuestLocationPicker guestCode={guestCode} />;
      case 'travel':
        return <GuestTravelForm guestCode={guestCode} />;
      case 'seating':
        return <PublicSeatingChart guestCode={guestCode} showExpand={false} />;
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

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close quick actions' : 'Open quick actions'}
          aria-expanded={open}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-[#A67B5B] to-[#8C6A4D] text-white flex items-center justify-center shadow-xl shadow-[#A67B5B]/30 hover:scale-105 transition-transform"
        >
          <motion.span animate={{ rotate: open ? 135 : 0 }} transition={{ duration: 0.2 }}>
            {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </motion.span>
        </motion.button>
      </div>

      {/* Shared modal dialog for all three actions */}
      <Modal
        open={!!active}
        onClose={() => setActiveAction(null)}
        maxWidth={active?.maxWidth || 'lg'}
        label={active?.label}
      >
        {renderModalBody()}
      </Modal>
    </>
  );
}
