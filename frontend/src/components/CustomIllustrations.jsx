import { motion, useInView } from 'framer-motion';
import { useRef, memo } from 'react';
import { MotifCorner, MotifEmblem, Monogram } from './HeritageMotifs';

/**
 * PERFORMANCE-OPTIMIZED Custom Illustrations Component
 * - Uses will-change for GPU acceleration
 * - Memoized components to prevent re-renders
 * - Lazy loading with loading="lazy"
 * - Once-only animations where appropriate
 * - Reduced animation complexity
 */

// Base path for illustrations
const ILLUSTRATIONS_PATH = '/illustrations';

// Shared styles for GPU-accelerated transforms
const gpuAccelStyle = {
  willChange: 'transform, opacity',
  backfaceVisibility: 'hidden',
  perspective: 1000,
  transform: 'translateZ(0)',
};

/**
 * Pulsing Heart Logo/Loader - Memoized
 */
export const PulsingHeartLogo = memo(function PulsingHeartLogo({ size = 80, className = '' }) {
  return (
    <motion.img
      src="/Naoa-logo.png"
      alt="Logo"
      width={size}
      height={size}
      loading="eager"
      className={className}
      animate={{
        scale: [1, 1.12, 1],
      }}
      transition={{
        duration: 1.8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{ ...gpuAccelStyle, objectFit: 'contain' }}
    />
  );
});

/**
 * Loading Heart with glow - Memoized
 */
export const LoadingHeart = memo(function LoadingHeart({ size = 100, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(166, 123, 91, 0.3) 0%, transparent 70%)',
          filter: 'blur(15px)',
          ...gpuAccelStyle,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.img
        src="/Naoa-logo.png"
        alt="Loading..."
        width={size}
        height={size}
        loading="eager"
        className="relative z-10 rounded-xl"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ ...gpuAccelStyle, objectFit: 'contain' }}
      />
    </div>
  );
});

/**
 * Male Icon - Memoized with once animation
 */
export const MaleIcon = memo(function MaleIcon({ size = 60, className = '', animate = true }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  
  return (
    <motion.img
      ref={ref}
      src={`${ILLUSTRATIONS_PATH}/male-icon.png`}
      alt="Male"
      width={size}
      height={size}
      loading="lazy"
      className={className}
      initial={animate ? { opacity: 0, x: 20 } : false}
      animate={animate && isInView ? { opacity: 1, x: 0 } : undefined}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ ...gpuAccelStyle, objectFit: 'contain' }}
    />
  );
});

/**
 * Female Icon - Memoized with once animation
 */
export const FemaleIcon = memo(function FemaleIcon({ size = 60, className = '', animate = true }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  
  return (
    <motion.img
      ref={ref}
      src={`${ILLUSTRATIONS_PATH}/female-icon.png`}
      alt="Female"
      width={size}
      height={size}
      loading="lazy"
      className={className}
      initial={animate ? { opacity: 0, x: -20 } : false}
      animate={animate && isInView ? { opacity: 1, x: 0 } : undefined}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ ...gpuAccelStyle, objectFit: 'contain' }}
    />
  );
});

/*
 * Decorations below keep their historical "Flower" names (every page imports
 * them) but now draw the couple's mood board: patterned cloth in the corners,
 * carved-motif emblems and the monogram frame (see HeritageMotifs.jsx).
 */

/** Patterned corner, top left (was the big corner flower). */
export const MainFlowerTopLeft = memo(function MainFlowerTopLeft({ size = 300, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <motion.div
      ref={ref}
      className={`absolute top-0 left-0 pointer-events-none ${className}`}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : undefined}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={gpuAccelStyle}
    >
      <MotifCorner size={size} corner="top-left" className="block" />
    </motion.div>
  );
});

/** Patterned corner, bottom right. */
export const MainFlowerBottomRight = memo(function MainFlowerBottomRight({ size = 300, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <motion.div
      ref={ref}
      className={`absolute bottom-0 right-0 pointer-events-none ${className}`}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : undefined}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      style={gpuAccelStyle}
    >
      <MotifCorner size={size} corner="bottom-right" className="block" />
    </motion.div>
  );
});

/** Smaller patterned corners. */
export const SecondaryFlowerTopLeft = memo(function SecondaryFlowerTopLeft({ size = 150, className = '' }) {
  return <MotifCorner size={size} corner="top-left" opacity={0.45} className={className} />;
});

export const SecondaryFlowerBottomRight = memo(function SecondaryFlowerBottomRight({ size = 150, className = '' }) {
  return <MotifCorner size={size} corner="bottom-right" opacity={0.45} className={className} />;
});

/** A single carved-motif emblem. */
function FadeInEmblem({ size, className, delay = 0, variant, scaleFrom = 0.85 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <motion.div
      ref={ref}
      className={`pointer-events-none inline-flex items-center justify-center ${className}`}
      initial={{ opacity: 0, scale: scaleFrom }}
      animate={isInView ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      style={{ ...gpuAccelStyle, width: size, height: size }}
    >
      <MotifEmblem size={size * 0.6} variant={variant} />
    </motion.div>
  );
}

export const CenteredFlower = memo(function CenteredFlower({ size = 120, className = '', delay = 0 }) {
  return <FadeInEmblem size={size} className={className} delay={delay} variant="sun" />;
});

/** Three emblems in a row: mask, eye, mask. */
export const FlowersCentered = memo(function FlowersCentered({ size = 200, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const unit = size / 4;
  return (
    <motion.div
      ref={ref}
      className={`pointer-events-none inline-flex items-center justify-center gap-2 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      style={{ ...gpuAccelStyle, width: size }}
    >
      <MotifEmblem size={unit} variant="mask" />
      <MotifEmblem size={unit * 1.3} variant="eye" />
      <MotifEmblem size={unit} variant="mask" />
    </motion.div>
  );
});

export const FlowerColorCircles = memo(function FlowerColorCircles({ size = 250, className = '' }) {
  return <FadeInEmblem size={size} className={className} variant="sun" scaleFrom={1} />;
});

/** Oval frame with leaf sprigs (the monogram's frame) around children. */
export const InvitationNameFrame = memo(function InvitationNameFrame({ size = 400, className = '', children }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      className={`relative inline-block ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={gpuAccelStyle}
    >
      <Monogram size={size / 1.32} first="" second="" />
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </motion.div>
  );
});

const emblemForType = {
  'centered': 'sun',
  'secondary-top-left': 'mask',
  'secondary-bottom-right': 'eye',
  'color-circles': 'sun',
  'flowers': 'eye',
};

/** Gently floating emblem. */
export const FloatingFlower = memo(function FloatingFlower({
  type = 'centered',
  size = 100,
  className = '',
  duration = 6,
  distance = 10,
  delay = 0,
}) {
  return (
    <motion.div
      className={`pointer-events-none hidden md:block ${className}`}
      animate={{ y: [-distance / 2, distance / 2, -distance / 2] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
      style={{ ...gpuAccelStyle, opacity: 0.55 }}
    >
      <MotifEmblem size={size * 0.55} variant={emblemForType[type] || 'sun'} />
    </motion.div>
  );
});

export const ParallaxFlower = memo(function ParallaxFlower({
  type = 'centered',
  size = 150,
  className = '',
  parallaxOffset = 30,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0 });

  return (
    <motion.div
      ref={ref}
      className={`pointer-events-none ${className}`}
      initial={{ y: parallaxOffset, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 0.6 } : undefined}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={gpuAccelStyle}
    >
      <MotifEmblem size={size * 0.5} variant={emblemForType[type] || 'sun'} />
    </motion.div>
  );
});

/** Divider: two hairlines with a carved eye emblem between them. */
export const FlowerDivider = memo(function FlowerDivider({ className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div ref={ref} className={`flex items-center justify-center gap-4 py-6 ${className}`}>
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={isInView ? { scaleX: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="h-px w-20 md:w-32 origin-right"
        style={{ background: 'linear-gradient(90deg, transparent, #B8936C)', ...gpuAccelStyle }}
      />
      <MotifEmblem size={34} variant="eye" />
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={isInView ? { scaleX: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="h-px w-20 md:w-32 origin-left"
        style={{ background: 'linear-gradient(90deg, #B8936C, transparent)', ...gpuAccelStyle }}
      />
    </div>
  );
});

// Default export
export default {
  PulsingHeartLogo,
  LoadingHeart,
  MaleIcon,
  FemaleIcon,
  MainFlowerTopLeft,
  MainFlowerBottomRight,
  SecondaryFlowerTopLeft,
  SecondaryFlowerBottomRight,
  CenteredFlower,
  FlowersCentered,
  FlowerColorCircles,
  InvitationNameFrame,
  FloatingFlower,
  ParallaxFlower,
  FlowerDivider,
};
