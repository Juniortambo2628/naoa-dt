import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

/**
 * Full-screen overlay primitive used by every modal, lightbox and fullscreen
 * view. It always renders into document.body, so it covers the whole viewport
 * even when opened from inside an animated (transformed) container such as
 * AdminPageLayout — a `position: fixed` element inside a transformed ancestor
 * is otherwise sized to that ancestor, leaving part of the screen uncovered.
 *
 * Also handles Escape-to-close, background scroll lock and backdrop clicks.
 * Wrap in <AnimatePresence> for the fade-out on close.
 *
 * @param {() => void} [onClose]      Called on Escape / backdrop click.
 * @param {string} [className]        Layout of the content (alignment, padding).
 * @param {string} [backdropClassName] Backdrop colour/blur; '' for transparent.
 * @param {number} [zIndex]           Stacking order (default 100).
 * @param {boolean} [closeOnBackdrop] Close when the backdrop itself is clicked.
 * @param {boolean} [lockScroll]      Prevent the page behind from scrolling.
 */
export default function Overlay({
  children,
  onClose,
  className = 'flex items-center justify-center p-4',
  backdropClassName = 'bg-black/60 backdrop-blur-sm',
  zIndex = 100,
  closeOnBackdrop = true,
  lockScroll = true,
  style,
  ...rest
}) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (lockScroll) document.body.style.overflow = prevOverflow;
    };
  }, [onClose, lockScroll]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 ${backdropClassName} ${className}`}
      style={{ zIndex, ...style }}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
      }}
      {...rest}
    >
      {children}
    </motion.div>,
    document.body
  );
}

/**
 * Renders children in place, or — while `active` — into document.body, so an
 * element that switches itself to `position: fixed` (e.g. a fullscreen
 * preview) covers the whole viewport instead of its transformed ancestor.
 */
export function PortalWhen({ active, children }) {
  if (!active || typeof document === 'undefined') return children;
  return createPortal(children, document.body);
}
