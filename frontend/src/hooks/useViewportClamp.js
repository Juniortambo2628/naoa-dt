import { useLayoutEffect, useState } from 'react';

/**
 * Keep an open popover/menu horizontally inside the viewport.
 *
 * Popovers in the floating toolbar are anchored to their trigger button, but
 * where that button lands depends on how the toolbar wraps on each page and
 * screen size, so a fixed CSS anchor can still run off a phone screen. This
 * measures the popover once it opens (and on resize) and returns the horizontal
 * shift, in px, that brings it back inside the viewport. Apply it as a
 * framer-motion `x` style (`style={{ x: shift }}`) so it composes with the
 * popover's own enter/exit animation.
 *
 * @param {React.RefObject<HTMLElement>} ref - the popover element
 * @param {boolean} open - whether the popover is currently shown
 * @param {number} [margin=12] - minimum gap to keep from the viewport edges
 * @returns {number} horizontal shift in px (0 when it already fits)
 */
export default function useViewportClamp(ref, open, margin = 12) {
  const [shift, setShift] = useState(0);

  useLayoutEffect(() => {
    if (!open) {
      setShift(0);
      return undefined;
    }

    const measure = () => {
      const el = ref.current;
      if (!el) return;
      setShift((current) => {
        const rect = el.getBoundingClientRect();
        const viewport = document.documentElement.clientWidth;
        // Where the popover sits without any shift applied.
        const left = rect.left - current;
        const right = rect.right - current;
        let next = 0;
        if (right > viewport - margin) next = viewport - margin - right;
        // If it's wider than the room available, keep the start visible.
        if (left + next < margin) next = margin - left;
        return Math.round(next);
      });
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [ref, open, margin]);

  return shift;
}
