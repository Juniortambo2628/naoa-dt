import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FlowerDivider } from './CustomIllustrations';
import { fadeInUp } from '../hooks/useScrollAnimation';

/** Fallback height of the fixed navbar (it is measured once the page is up). */
const NAV_FALLBACK = 72;

/**
 * A public page's title (and subtitle) that stays pinned under the navbar as
 * the guest scrolls, compacting once pinned. The page's <main> must not clip
 * vertically (use overflow-x-clip, not overflow-hidden), or sticky won't stick.
 *
 * - `bar`: extra content kept inside the pinned bar (e.g. tabs); `barClassName` styles its wrapper.
 * - `onLayout({ navH, headerH, stuck })`: for pages that pin more below it.
 * - `sentinelRef`: marks where the bar starts, to scroll back to it.
 */
export default function StickyPageHeader({ title, subtitle, bar = null, barClassName = '', onLayout, sentinelRef, className = '' }) {
  const ownSentinel = useRef(null);
  const sentinel = sentinelRef || ownSentinel;
  const headerRef = useRef(null);
  const [navH, setNavH] = useState(NAV_FALLBACK);
  const [headerH, setHeaderH] = useState(0);
  const [stuck, setStuck] = useState(false);

  // The fixed navbar's height (it differs on phones and shrinks on scroll).
  useEffect(() => {
    const nav = document.querySelector('nav.fixed');
    if (!nav || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => setNavH(Math.round(nav.getBoundingClientRect().height)));
    ro.observe(nav, { box: 'border-box' });
    return () => ro.disconnect();
  }, []);

  // Pinned once the spot it started from has scrolled under the navbar.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < navH + 1),
      { rootMargin: `-${navH}px 0px 0px 0px`, threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [navH, sentinel]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => setHeaderH(el.offsetHeight));
    ro.observe(el, { box: 'border-box' });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    onLayout?.({ navH, headerH, stuck });
  }, [onLayout, navH, headerH, stuck]);

  return (
    <>
      <FlowerDivider />
      <div ref={sentinel} aria-hidden="true" />
      <div ref={headerRef} className={`sticky z-30 -mx-4 px-4 sm:mx-0 sm:px-0 ${className}`} style={{ top: navH }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className={`text-center transition-all duration-300 rounded-b-3xl ${
            stuck
              ? 'py-2.5 px-4 bg-[#FDFAF5]/90 backdrop-blur-xl shadow-[0_8px_24px_rgba(74,63,53,0.08)] border-b border-[#E4D6C2]/70'
              : 'pb-4'
          }`}
        >
          <h1
            className={`leading-tight transition-all duration-300 ${stuck ? 'text-[1.75rem]! md:text-4xl!' : 'text-5xl md:text-6xl mb-2 md:mb-4'}`}
            style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
          >
            {title}
          </h1>
          {subtitle && (
            <div
              className={`mx-auto max-w-2xl transition-all duration-300 ${stuck ? 'text-sm md:text-base truncate' : 'text-lg'}`}
              style={{ color: '#6B5D52', fontFamily: "'Cormorant Garamond', serif" }}
            >
              {subtitle}
            </div>
          )}
          {bar && <div className={`${stuck ? 'mt-2' : 'mt-5'} ${barClassName}`}>{bar}</div>}
        </motion.div>
      </div>
    </>
  );
}
