import { motion, useInView } from 'framer-motion';
import { useRef, memo, useMemo } from 'react';

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
      src={`${ILLUSTRATIONS_PATH}/loader-heart-pulse.png`}
      alt="Heart"
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
        src={`${ILLUSTRATIONS_PATH}/loader-heart-pulse.png`}
        alt="Loading..."
        width={size}
        height={size}
        loading="eager"
        className="relative z-10"
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

/**
 * Main Flower Top Left - Memoized with once animation
 */
export const MainFlowerTopLeft = memo(function MainFlowerTopLeft({ size = 300, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  
  return (
    <motion.img
      ref={ref}
      src={`${ILLUSTRATIONS_PATH}/main-flower-top-left-brown.png`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={`absolute top-0 left-0 pointer-events-none ${className}`}
      initial={{ opacity: 0, x: -30, y: -30 }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : undefined}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ ...gpuAccelStyle, objectFit: 'contain' }}
    />
  );
});

/**
 * Main Flower Bottom Right - Memoized with once animation
 */
export const MainFlowerBottomRight = memo(function MainFlowerBottomRight({ size = 300, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  
  return (
    <motion.img
      ref={ref}
      src={`${ILLUSTRATIONS_PATH}/main-flower-bottom-right-brown.png`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={`absolute bottom-0 right-0 pointer-events-none ${className}`}
      initial={{ opacity: 0, x: 30, y: 30 }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : undefined}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      style={{ ...gpuAccelStyle, objectFit: 'contain' }}
    />
  );
});

/**
 * Secondary Flowers - Memoized
 */
export const SecondaryFlowerTopLeft = memo(function SecondaryFlowerTopLeft({ size = 150, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  
  return (
    <motion.img
      ref={ref}
      src={`${ILLUSTRATIONS_PATH}/flower-secondary-top-left.png`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={`pointer-events-none ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ ...gpuAccelStyle, objectFit: 'contain' }}
    />
  );
});

export const SecondaryFlowerBottomRight = memo(function SecondaryFlowerBottomRight({ size = 150, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  
  return (
    <motion.img
      ref={ref}
      src={`${ILLUSTRATIONS_PATH}/flower-secondary-bottom-right.png`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={`pointer-events-none ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ ...gpuAccelStyle, objectFit: 'contain' }}
    />
  );
});

/**
 * Centered Flower - Memoized
 */
export const CenteredFlower = memo(function CenteredFlower({ size = 120, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  
  return (
    <motion.img
      ref={ref}
      src={`${ILLUSTRATIONS_PATH}/flower-centered.png`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={`pointer-events-none ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      style={{ ...gpuAccelStyle, objectFit: 'contain' }}
    />
  );
});

/**
 * Flowers Centered cluster - Memoized
 */
export const FlowersCentered = memo(function FlowersCentered({ size = 200, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  
  return (
    <motion.img
      ref={ref}
      src={`${ILLUSTRATIONS_PATH}/flowers-centered.png`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={`pointer-events-none ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      style={{ ...gpuAccelStyle, objectFit: 'contain' }}
    />
  );
});

/**
 * Flower Color Circles - Memoized
 */
export const FlowerColorCircles = memo(function FlowerColorCircles({ size = 250, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  
  return (
    <motion.img
      ref={ref}
      src={`${ILLUSTRATIONS_PATH}/flower-color-circles.png`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={`pointer-events-none ${className}`}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : undefined}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ ...gpuAccelStyle, objectFit: 'contain' }}
    />
  );
});

/**
 * Invitation Name Frame - Memoized
 */
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
      <img
        src={`${ILLUSTRATIONS_PATH}/invitation-name-frame.png`}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="pointer-events-none"
        style={{ objectFit: 'contain' }}
      />
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </motion.div>
  );
});

/**
 * Floating Flower - Optimized with CSS animation for better performance
 */
const flowerSrcMap = {
  'centered': 'flower-centered.png',
  'secondary-top-left': 'flower-secondary-top-left.png',
  'secondary-bottom-right': 'flower-secondary-bottom-right.png',
  'color-circles': 'flower-color-circles.png',
};

export const FloatingFlower = memo(function FloatingFlower({ 
  type = 'centered', 
  size = 100, 
  className = '',
  duration = 6,
  distance = 10,
  delay = 0,
}) {
  const src = useMemo(() => 
    `${ILLUSTRATIONS_PATH}/${flowerSrcMap[type] || flowerSrcMap['centered']}`,
    [type]
  );
  
  return (
    <motion.img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={`pointer-events-none ${className}`}
      animate={{
        y: [-distance / 2, distance / 2, -distance / 2],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{ ...gpuAccelStyle, objectFit: 'contain' }}
    />
  );
});

/**
 * Parallax Flower - Memoized
 */
export const ParallaxFlower = memo(function ParallaxFlower({
  type = 'centered',
  size = 150,
  className = '',
  parallaxOffset = 30,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0 });
  
  const src = useMemo(() => {
    const srcMap = {
      'centered': 'flower-centered.png',
      'flowers': 'flowers-centered.png',
      'color-circles': 'flower-color-circles.png',
    };
    return `${ILLUSTRATIONS_PATH}/${srcMap[type] || srcMap['centered']}`;
  }, [type]);
  
  return (
    <motion.img
      ref={ref}
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={`pointer-events-none ${className}`}
      initial={{ y: parallaxOffset, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : undefined}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{ ...gpuAccelStyle, objectFit: 'contain' }}
    />
  );
});

/**
 * Flower Divider - Memoized, simplified animation
 */
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
        style={{ background: 'linear-gradient(90deg, transparent, #C8A68E)', ...gpuAccelStyle }}
      />
      <img
        src={`${ILLUSTRATIONS_PATH}/flower-centered.png`}
        alt=""
        width={40}
        height={40}
        loading="lazy"
        className="pointer-events-none"
        style={{ objectFit: 'contain' }}
      />
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={isInView ? { scaleX: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="h-px w-20 md:w-32 origin-left"
        style={{ background: 'linear-gradient(90deg, #C8A68E, transparent)', ...gpuAccelStyle }}
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
