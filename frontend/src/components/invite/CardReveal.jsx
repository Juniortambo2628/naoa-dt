import { useEffect, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Monogram, SealStamp, CloudLine } from '../HeritageMotifs';

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
      <p lang="zh-Hans" className="text-[11px] tracking-[0.4em] mt-1" style={{ color: '#A67B5B' }}>敬请光临</p>
      <p className="font-serif text-2xl sm:text-[28px] text-stone-800 mt-2 leading-tight">
        Dear {guestName || 'Guest'},
      </p>

      <CloudLine width={170} className="my-4" />

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

      <div className="mt-auto pt-4 flex items-center justify-center gap-3">
        <Monogram size={34} />
        <SealStamp size={22} />
      </div>
    </div>
  );
}

const PAPER = '#F7F0E5';
const PAPER_DEEP = '#EDE2D1';
const FOLD = '#E2D3BD';

/** Envelope back: the inside wall the card sits against. */
function EnvelopeBack() {
  return <div className="absolute inset-0 rounded-t-md" style={{ background: PAPER_DEEP }} />;
}

/** Envelope front pocket: the two side folds and bottom, which hide the card. */
function EnvelopePocket() {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="pocket-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAPER} />
          <stop offset="1" stopColor="#F1E7D8" />
        </linearGradient>
      </defs>
      {/* Side folds meet in a V below the opening, like a real envelope */}
      {/* Shallower than the closed flap, so the flap always covers the opening */}
      <path d="M0 0 L200 70 L400 0 V200 H0Z" fill="url(#pocket-fill)" />
      <path d="M0 0 L200 70 L400 0" fill="none" stroke={FOLD} strokeWidth="1.2" />
      <path d="M0 200 L170 112 M400 200 L230 112" fill="none" stroke={FOLD} strokeWidth="0.8" opacity="0.7" />
    </svg>
  );
}

/**
 * The top flap, hinged on the envelope's top edge. Closed it folds down over
 * the pocket with the T&D seal; open it stands up behind the card, showing
 * the patterned liner.
 */
function EnvelopeFlap({ rotateX, zIndex, sealOpacity }) {
  const face = 'absolute inset-0 [backface-visibility:hidden]';
  return (
    <motion.div
      className="absolute inset-x-0 top-0 h-[58%] origin-top"
      style={{ rotateX, zIndex, transformPerspective: 1100, transformStyle: 'preserve-3d' }}
    >
      {/* Outside of the flap (seen when closed) */}
      <svg viewBox="0 0 400 120" preserveAspectRatio="none" className={face} aria-hidden="true">
        <path d="M0 0 H400 L210 114 Q200 120 190 114 Z" fill={PAPER} stroke={FOLD} strokeWidth="1.2" />
      </svg>
      <motion.div className={`${face} flex items-end justify-center pb-[6%]`} style={{ opacity: sealOpacity }}>
        <span
          className="flex items-center justify-center rounded-full w-14 h-14 sm:w-16 sm:h-16 bg-[#FFFDF8]"
          style={{ boxShadow: '0 2px 8px rgba(74, 63, 53, 0.18)', border: `1px solid ${CARAMEL}` }}
        >
          <Monogram size={26} />
        </span>
      </motion.div>
      {/* Inside of the flap (the liner, seen when open) */}
      <div className={face} style={{ transform: 'rotateX(180deg)' }}>
        <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
          <defs>
            <pattern id="flap-liner" width="26" height="26" patternUnits="userSpaceOnUse">
              <rect width="26" height="26" fill="#FBF6EE" />
              <path d="M13 4 L22 13 L13 22 L4 13Z" fill="none" stroke={CARAMEL} strokeWidth="1" opacity="0.55" />
              <circle cx="13" cy="13" r="2" fill={CARAMEL} opacity="0.55" />
            </pattern>
          </defs>
          {/* Drawn upside down: this face is flipped twice (here and by the hinge) */}
          <path d="M0 120 H400 L210 6 Q200 0 190 6 Z" fill="url(#flap-liner)" stroke={FOLD} strokeWidth="1.2" />
        </svg>
      </div>
    </motion.div>
  );
}

/** Where a first visit starts: envelope open, card peeking (see the timeline below). */
const PEEK = 0.13;

/**
 * The invitation's opening, pinned while it plays. A first visit lands with
 * the envelope open and the guest's card peeking out under the T&D.
 * Scrolling down pulls the card up to reveal the details while the envelope
 * slips away; scrolling all the way up tucks the card back in and closes the
 * flap over it, sealed. Transforms only (smooth on phones); guests who
 * prefer reduced motion get the card, still.
 *
 * Timeline (scroll progress through the section):
 *   0 → 0.06   flap opens        (scrolling up: closes)
 *   0.06 → 0.11 card rises to its peek
 *   0.11 → 0.16 resting peek (where the page opens)
 *   0.16 → 0.72 card comes all the way out
 *   0.55 → 0.90 envelope slips away
 */
export default function CardReveal({ guestName, coupleNames, dateText, venue }) {
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  const cardY = useTransform(scrollYProgress, [0, 0.06, 0.11, 0.16, 0.72], ['54svh', '54svh', '33svh', '33svh', '0svh']);
  const cardScale = useTransform(scrollYProgress, [0.16, 0.72], [0.96, 1]);
  const flapRotate = useTransform(scrollYProgress, [0, 0.06], [0, 180]);
  // In front of the card while closed, behind it once past upright.
  const flapZ = useTransform(flapRotate, (deg) => (deg < 90 ? 30 : 5));
  const sealOpacity = useTransform(scrollYProgress, [0, 0.03], [1, 0]);
  const envelopeY = useTransform(scrollYProgress, [0.55, 0.9], ['0svh', '34svh']);
  const envelopeOpacity = useTransform(scrollYProgress, [0.6, 0.9], [1, 0]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.16, 0.22], [1, 1, 0]);
  const moreOpacity = useTransform(scrollYProgress, [0.85, 0.95], [0, 1]);

  // Open on the peek (envelope open) rather than the sealed envelope, unless
  // the guest arrived for a specific part of the page or has already scrolled.
  useEffect(() => {
    if (reduceMotion) return undefined;
    const el = sectionRef.current;
    if (!el || window.location.hash || window.scrollY > 4) return undefined;
    const raf = requestAnimationFrame(() => {
      const travel = el.offsetHeight - window.innerHeight;
      if (travel > 0) window.scrollTo({ top: el.offsetTop + travel * PEEK, behavior: 'instant' });
    });
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion]);

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
    <section ref={sectionRef} className="relative h-[250svh]" aria-label="Your invitation">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* T&D, top centre */}
        <div className="absolute inset-x-0 top-5 sm:top-7 flex justify-center z-40">
          <Monogram size={46} title={coupleNames} />
        </div>

        {/* The envelope: back wall, flap (behind or over the card), front pocket */}
        <motion.div
          className="absolute left-1/2 top-[64svh] w-[min(96vw,440px)] h-[40svh] will-change-transform"
          style={{ y: envelopeY, opacity: envelopeOpacity, x: '-50%', zIndex: 5 }}
        >
          <EnvelopeBack />
        </motion.div>

        {/* The card */}
        <motion.div
          className="absolute left-1/2 top-[15svh] z-10 w-[min(88vw,400px)] h-[min(126vw,540px,66svh)] will-change-transform"
          style={{ y: cardY, scale: cardScale, x: '-50%' }}
        >
          <InviteCard {...card} />
        </motion.div>

        <motion.div
          className="absolute left-1/2 top-[64svh] w-[min(96vw,440px)] h-[40svh] will-change-transform pointer-events-none"
          style={{ y: envelopeY, opacity: envelopeOpacity, x: '-50%', zIndex: 20 }}
        >
          <EnvelopePocket />
        </motion.div>

        {/* The flap sits outside the pocket layer so it can pass behind the card */}
        <motion.div
          className="absolute left-1/2 top-[64svh] w-[min(96vw,440px)] h-[40svh] will-change-transform pointer-events-none"
          style={{ y: envelopeY, opacity: envelopeOpacity, x: '-50%', zIndex: flapZ }}
        >
          <EnvelopeFlap rotateX={flapRotate} zIndex={1} sealOpacity={sealOpacity} />
        </motion.div>

        <motion.div
          className="absolute inset-x-0 top-[31svh] z-40 flex flex-col items-center gap-1 text-center pointer-events-none"
          style={{ opacity: hintOpacity }}
        >
          <p className="font-serif text-lg text-stone-700">Scroll to open your invitation</p>
          <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: CARAMEL }} />
        </motion.div>

        <motion.div
          className="absolute inset-x-0 bottom-24 z-40 flex flex-col items-center gap-0.5 text-center pointer-events-none"
          style={{ opacity: moreOpacity }}
        >
          <p className="font-serif text-base text-stone-600">Keep scrolling for the details</p>
          <ChevronDown className="w-4 h-4 animate-bounce" style={{ color: CARAMEL }} />
        </motion.div>

        <button
          type="button"
          onClick={skip}
          className="absolute top-6 right-4 z-40 px-4 py-2 rounded-full bg-white/70 backdrop-blur-md border border-white/80 text-sm font-medium text-stone-700 shadow-sm"
        >
          Skip
        </button>
      </div>
    </section>
  );
}
