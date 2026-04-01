import { useRef, useEffect, useState } from 'react';
import { useScroll, useTransform, useSpring, useInView, useMotionValue } from 'framer-motion';

/**
 * Hook for creating smooth scroll-based animations
 */
export function useScrollAnimation(options = {}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: false, 
    amount: options.amount || 0.3,
    ...options 
  });
  
  return { ref, isInView };
}

/**
 * Hook for parallax scrolling effect
 */
export function useParallax(value, distance = 100) {
  return useTransform(value, [0, 1], [-distance, distance]);
}

/**
 * Hook for sticky scroll sections
 */
export function useStickyScroll() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  return { containerRef, scrollYProgress, smoothProgress };
}

/**
 * Hook for sequential text reveal (word by word)
 */
export function useTextReveal(text, options = {}) {
  const words = text.split(' ');
  const { delay = 0, staggerDelay = 0.08 } = options;
  
  return words.map((word, index) => ({
    word,
    delay: delay + (index * staggerDelay),
  }));
}

/**
 * Hook for drawing SVG path animation
 */
export function useDrawPath(isInView, options = {}) {
  const { duration = 2, delay = 0 } = options;
  
  return {
    initial: { pathLength: 0, opacity: 0 },
    animate: isInView ? { 
      pathLength: 1, 
      opacity: 1,
      transition: { 
        pathLength: { duration, delay, ease: "easeInOut" },
        opacity: { duration: 0.5, delay }
      }
    } : { pathLength: 0, opacity: 0 },
  };
}

/**
 * Hook for mouse-following parallax
 */
export function useMouseParallax(intensity = 0.05) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      x.set((e.clientX - centerX) * intensity);
      y.set((e.clientY - centerY) * intensity);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [intensity, x, y]);
  
  return { x, y };
}

/**
 * Hook for counting animation
 */
export function useCountUp(end, options = {}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const { duration = 2000, delay = 0 } = options;
  
  useEffect(() => {
    if (!isInView) return;
    
    const timeout = setTimeout(() => {
      let start = 0;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        
        setCount(Math.floor(easeProgress * end));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      
      requestAnimationFrame(animate);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [isInView, end, duration, delay]);
  
  return { ref, count, isInView };
}

/**
 * Animation variants for staggered children
 */
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/**
 * Fade variants
 */
export const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const fadeInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const fadeInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/**
 * Scale variants
 */
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export const scaleUp = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
};

/**
 * Rotate variants
 */
export const rotateIn = {
  hidden: { opacity: 0, rotate: -10, scale: 0.9 },
  visible: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};
