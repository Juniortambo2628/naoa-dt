import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Monogram, BackdropStrip } from '../HeritageMotifs';

const CARAMEL = '#C4A385';

/** The guest's invitation card (shared by the animated and the still version). */
function InviteCard({ guestName, coupleNames, dateText, venue }) {
  return (
    <div
      className="relative w-full h-full rounded-[18px] bg-[#FFFDF8] px-6 sm:px-8 py-7 text-center flex flex-col items-center"
      style={{ boxShadow: '0 24px 60px rgba(74, 63, 53, 0.16), 0 2px 6px rgba(74, 63, 53, 0.06)' }}
    >
      <div className="absolute inset-3 rounded-[12px] border pointer-events-none" style={{ borderColor: 'rgba(196, 163, 133, 0.75)' }} />
      <div className="absolute inset-[18px] rounded-[9px] border pointer-events-none" style={{ borderColor: 'rgba(196, 163, 133, 0.3)' }} />

      {/* What peeks out of the sleeve first */}
      <p className="text-[11px] tracking-[0.3em] uppercase text-stone-500 mt-2">You are invited</p>
      <p className="font-serif text-2xl sm:text-[28px] text-stone-800 mt-2 leading-tight">
        Dear {guestName || 'Guest'},
      </p>

      <div className="w-16 h-px my-5" style={{ background: `linear-gradient(90deg, transparent, ${CARAMEL}, transparent)` }} />

      <p className="font-serif text-base text-stone-600">together with their families</p>
      <p className="mt-2 text-[40px] sm:text-[46px] leading-tight" style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}>
        {coupleNames}
      </p>
      <p className="font-serif text-base text-stone-600 mt-2 max-w-[17rem]">
        request the pleasure of your company at their traditional wedding celebration
      </p>

      <div className="mt-5 space-y-1">
        <p className="font-serif text-xl text-stone-800">{dateText}</p>
        {venue && <p className="font-serif text-base text-stone-600">{venue}</p>}
      </div>

      <div className="mt-auto pt-4 w-full">
        <BackdropStrip height={34} />
      </div>
    </div>
  );
}

/** The ivory sleeve the card slides out of (two soft folds, like an envelope pocket). */
function Sleeve() {
  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id="sleeve-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F7F0E5" />
            <stop offset="1" stopColor="#F1E7D8" />
          </linearGradient>
        </defs>
        <path d="M0 6 Q0 0 6 0 H394 Q400 0 400 6 V200 H0Z" fill="url(#sleeve-fill)" />
        <path d="M0 4 L200 92 L400 4" fill="none" stroke="#E2D3BD" strokeWidth="1.2" />
      </svg>
      <div className="absolute inset-x-0 -top-3 h-3 rounded-t-full" style={{ boxShadow: '0 -6px 14px rgba(74, 63, 53, 0.08)' }} />
    </div>
  );
}

/**
 * The invitation's opening. The guest's card peeks out of a sleeve under the
 * T&D monogram; scrolling pulls it up to reveal the details while the sleeve
 * slips away (scrolling back tucks it in again). The stage stays pinned while
 * this plays. Transforms only (smooth on phones); guests who prefer reduced
 * motion get the card, still.
 */
export default function CardReveal({ guestName, coupleNames, dateText, venue }) {
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  // Card: peeking (greeting showing above the sleeve) -> fully out.
  const cardY = useTransform(scrollYProgress, [0.08, 0.72], ['33svh', '0svh']);
  const cardScale = useTransform(scrollYProgress, [0.08, 0.72], [0.96, 1]);
  // Sleeve: stays while the card rises, then slips down and away.
  const sleeveY = useTransform(scrollYProgress, [0.55, 0.9], ['0svh', '30svh']);
  const sleeveOpacity = useTransform(scrollYProgress, [0.6, 0.9], [1, 0]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const moreOpacity = useTransform(scrollYProgress, [0.85, 0.95], [0, 1]);

  const card = { guestName, coupleNames, dateText, venue };

  if (reduceMotion) {
    return (
      <section className="px-4 pt-10 pb-4 flex flex-col items-center gap-6" aria-label="Your invitation">
        <Monogram size={48} />
        <div className="w-[min(88vw,400px)] h-[min(126vw,560px)]">
          <InviteCard {...card} />
        </div>
      </section>
    );
  }

  const skip = () => {
    const el = sectionRef.current;
    if (el) window.scrollTo({ top: el.offsetTop + el.offsetHeight - window.innerHeight * 0.2, behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="relative h-[230svh]" aria-label="Your invitation">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* T&D, top centre */}
        <div className="absolute inset-x-0 top-5 sm:top-7 flex justify-center z-30">
          <Monogram size={46} title={coupleNames} />
        </div>

        {/* The card */}
        <motion.div
          className="absolute left-1/2 top-[15svh] z-10 w-[min(88vw,400px)] h-[min(126vw,540px,66svh)] will-change-transform"
          style={{ y: cardY, scale: cardScale, x: '-50%' }}
        >
          <InviteCard {...card} />
        </motion.div>

        {/* The sleeve it slides out of */}
        <motion.div
          className="absolute left-1/2 top-[64svh] z-20 w-[min(96vw,440px)] h-[40svh] will-change-transform"
          style={{ y: sleeveY, opacity: sleeveOpacity, x: '-50%' }}
        >
          <Sleeve />
        </motion.div>

        <motion.div
          className="absolute inset-x-0 bottom-28 z-30 flex flex-col items-center gap-1 text-center pointer-events-none"
          style={{ opacity: hintOpacity }}
        >
          <p className="font-serif text-lg text-stone-700">Scroll to open your invitation</p>
          <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: CARAMEL }} />
        </motion.div>

        <motion.div
          className="absolute inset-x-0 bottom-24 z-30 flex flex-col items-center gap-0.5 text-center pointer-events-none"
          style={{ opacity: moreOpacity }}
        >
          <p className="font-serif text-base text-stone-600">Keep scrolling for the details</p>
          <ChevronDown className="w-4 h-4 animate-bounce" style={{ color: CARAMEL }} />
        </motion.div>

        <button
          type="button"
          onClick={skip}
          className="absolute top-6 right-4 z-30 px-4 py-2 rounded-full bg-white/70 backdrop-blur-md border border-white/80 text-sm font-medium text-stone-700 shadow-sm"
        >
          Skip
        </button>
      </div>
    </section>
  );
}
