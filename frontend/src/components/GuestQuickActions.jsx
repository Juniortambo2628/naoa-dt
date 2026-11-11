import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Home, MapPin, Plane, Armchair, Camera, CalendarClock, Play, Gift, LayoutGrid, X,
} from 'lucide-react';
import Modal from './Modal';
import TabbedTwoColumn from './TabbedTwoColumn';
import GuestLocationPicker from './GuestLocationPicker';
import GuestTravelForm from './GuestTravelForm';
import PublicSeatingChart from './PublicSeatingChart';
import GuestPolaroidCapture from './GuestPolaroidCapture';

// Every guest tool. `href` actions navigate; the rest open the shared modal.
const ACTIONS = [
  { id: 'location', label: 'Where are you', short: 'Location', icon: MapPin },
  { id: 'travel', label: 'My travel details', short: 'Travel', icon: Plane },
  { id: 'seating', label: 'Seating chart', short: 'Seating', icon: Armchair },
  { id: 'programme', label: 'Event programme', short: 'Programme', icon: CalendarClock, href: '/programme' },
  { id: 'stories', label: 'Watch stories', short: 'Stories', icon: Play, href: '/programme?stories=1' },
  {
    id: 'gift',
    label: 'Send a gift',
    short: 'Gift',
    icon: Gift,
    href: '#cash-gift', // opens the cash gift sheet on the invitation
    when: (settings) => Boolean(settings?.mpesa_stk_enabled || settings?.mpesa_paybill_number),
  },
  { id: 'polaroid', label: 'Snap a polaroid', short: 'Snap', icon: Camera },
];

// Actions shown as tabs inside the shared modal (link-only actions excluded).
const MODAL_ACTIONS = ACTIONS.filter((a) => !a.href);

/** The bar's middle three slots, in order of preference. */
const BAR_PREFERENCE = ['programme', 'gift', 'polaroid', 'seating'];

// Frosted "liquid glass" surface (translucent, blurred, with a soft rim light).
const GLASS =
  'bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.8] border border-white/70 ' +
  'shadow-[0_10px_40px_rgba(74,63,53,0.18),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(255,255,255,0.35)]';

function BarButton({ icon, label, active = false, onClick, ariaExpanded }) {
  const Icon = icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={ariaExpanded}
      aria-current={active ? 'page' : undefined}
      className="relative flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2 rounded-full text-stone-800 active:scale-95 transition-transform"
    >
      {active && (
        <motion.span
          layoutId="guest-bar-active"
          className="absolute inset-0 rounded-full bg-stone-900/[0.07]"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
      <Icon className="relative w-6 h-6" strokeWidth={active ? 2.4 : 1.9} />
      <span className="relative text-[10px] leading-none font-medium tracking-tight truncate max-w-full px-1">{label}</span>
    </button>
  );
}

/**
 * Guest tools on the invitation as a floating "liquid glass" bottom bar
 * (Instagram on iOS style): Home, three shortcuts, and More for the rest.
 */
export default function GuestQuickActions({ guestCode, settings = null }) {
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 240);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Some actions only make sense once set up (e.g. cash gifts).
  const visibleActions = ACTIONS.filter((a) => !a.when || a.when(settings));
  const barIds = BAR_PREFERENCE.filter((id) => visibleActions.some((a) => a.id === id)).slice(0, 3);
  const barActions = barIds.map((id) => visibleActions.find((a) => a.id === id));
  const moreActions = visibleActions.filter((a) => !barIds.includes(a.id));

  const handleSelect = (id) => {
    const action = ACTIONS.find((a) => a.id === id);
    setMoreOpen(false);
    if (action?.href) {
      navigate(action.href);
      return;
    }
    setActiveAction(id);
  };

  const goHome = () => {
    setMoreOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      {/* Tap-outside to close the More sheet */}
      <AnimatePresence>
        {moreOpen && (
          <motion.button
            type="button"
            aria-label="Close more actions"
            className="fixed inset-0 z-[9989] bg-stone-900/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMoreOpen(false)}
          />
        )}
      </AnimatePresence>

      <nav
        aria-label="Guest quick actions"
        className="fixed inset-x-0 bottom-0 z-[9990] flex justify-center px-3 pointer-events-none"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="w-full max-w-md pointer-events-auto">
          {/* More: the remaining tools, on the same glass */}
          <AnimatePresence>
            {moreOpen && (
              <motion.div
                id="guest-more-actions"
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className={`mb-3 rounded-[28px] p-2 ${GLASS} bg-white/90!`}
              >
                <div className="grid grid-cols-2 gap-1">
                  {moreActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => handleSelect(action.id)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-stone-800 hover:bg-white/60 active:scale-[0.98] transition"
                      >
                        <span className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow-sm text-[#9A7148]">
                          <Icon className="w-[18px] h-[18px]" />
                        </span>
                        <span className="text-sm font-medium leading-tight">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`flex items-stretch gap-1 rounded-full p-1.5 ${GLASS}`}>
            <BarButton icon={Home} label="Invite" active={atTop && !moreOpen} onClick={goHome} />
            {barActions.map((action) => (
              <BarButton
                key={action.id}
                icon={action.icon}
                label={action.short}
                onClick={() => handleSelect(action.id)}
              />
            ))}
            {moreActions.length > 0 && (
              <BarButton
                icon={moreOpen ? X : LayoutGrid}
                label="More"
                active={moreOpen}
                ariaExpanded={moreOpen}
                onClick={() => setMoreOpen((v) => !v)}
              />
            )}
          </div>
        </div>
      </nav>

      {/* Shared tabbed modal dialog for the in-page tools */}
      <Modal
        open={activeAction !== null}
        onClose={() => setActiveAction(null)}
        maxWidth="5xl"
        label="Quick actions"
      >
        <TabbedTwoColumn
          title="Quick actions"
          items={MODAL_ACTIONS}
          activeId={activeAction}
          onChange={setActiveAction}
          renderContent={renderModalBody}
        />
      </Modal>
    </>
  );
}
