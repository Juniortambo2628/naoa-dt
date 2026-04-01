import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

/**
 * Sticky Cards Section - Cards that stack and unstick as you scroll
 */
export function StickyCardsSection({ children, className = '' }) {
  const containerRef = useRef(null);
  
  return (
    <div 
      ref={containerRef} 
      className={`relative ${className}`}
      style={{ minHeight: `${React.Children.count(children) * 100}vh` }}
    >
      {React.Children.map(children, (child, index) => (
        <StickyCard 
          key={index} 
          index={index} 
          totalCards={React.Children.count(children)}
        >
          {child}
        </StickyCard>
      ))}
    </div>
  );
}

/**
 * Individual Sticky Card
 */
function StickyCard({ children, index, totalCards }) {
  const cardRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"]
  });
  
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1, 0.9]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.5]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [10, 0, -5]);
  
  return (
    <motion.div
      ref={cardRef}
      className="sticky top-20 w-full flex items-center justify-center min-h-screen"
      style={{
        scale,
        y,
        opacity,
        rotateX,
        perspective: 1000,
        zIndex: totalCards - index,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Horizontal Scroll Section - Content scrolls horizontally as page scrolls vertically
 */
export function HorizontalScrollSection({ children, className = '' }) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const x = useTransform(
    scrollYProgress, 
    [0, 1], 
    ["0%", `-${(React.Children.count(children) - 1) * 100}%`]
  );
  
  return (
    <div 
      ref={containerRef} 
      className={`relative ${className}`}
      style={{ height: `${React.Children.count(children) * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div 
          className="flex h-full"
          style={{ x }}
        >
          {React.Children.map(children, (child, index) => (
            <div 
              key={index}
              className="flex-shrink-0 w-screen h-full flex items-center justify-center"
            >
              {child}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Parallax Image with smooth movement
 */
export function ParallaxImage({ 
  src, 
  alt = '', 
  className = '',
  speed = 0.5,
  scale = 1.2,
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });
  
  return (
    <div 
      ref={ref} 
      className={`relative overflow-hidden ${className}`}
    >
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        style={{ 
          y: smoothY,
          scale,
        }}
      />
    </div>
  );
}

/**
 * Interactive Timeline Illustration
 */
export function TimelineIllustration({ items = [] }) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });
  
  return (
    <div ref={containerRef} className="relative py-20">
      {/* Animated Path */}
      <svg
        className="absolute left-1/2 top-0 h-full -translate-x-1/2"
        style={{ width: 100 }}
        viewBox="0 0 100 1000"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M50 0 Q 30 100, 50 200 T 50 400 T 50 600 T 50 800 T 50 1000"
          fill="none"
          stroke="#E8D4C8"
          strokeWidth="4"
        />
        <motion.path
          d="M50 0 Q 30 100, 50 200 T 50 400 T 50 600 T 50 800 T 50 1000"
          fill="none"
          stroke="#A67B5B"
          strokeWidth="4"
          strokeLinecap="round"
          style={{ 
            pathLength: scrollYProgress,
          }}
        />
      </svg>
      
      {/* Timeline Items */}
      <div className="relative z-10">
        {items.map((item, index) => (
          <TimelineItem 
            key={item.id || index} 
            item={item} 
            index={index}
            isLeft={index % 2 === 0}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineItem({ item, index, isLeft }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const x = useTransform(scrollYProgress, [0, 0.5], [isLeft ? -100 : 100, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  
  return (
    <motion.div
      ref={ref}
      className={`flex items-center gap-8 mb-20 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
      style={{ opacity, x, scale }}
    >
      <div className={`flex-1 ${isLeft ? 'text-right' : 'text-left'}`}>
        <div 
          className="inline-block p-6 rounded-2xl"
          style={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 10px 40px rgba(166, 123, 91, 0.15)',
          }}
        >
          <span 
            className="text-lg font-medium block mb-1"
            style={{ color: '#A67B5B' }}
          >
            {item.time}
          </span>
          <h3 
            className="text-2xl mb-2"
            style={{ fontFamily: "'Great Vibes', cursive", color: '#4A3F35' }}
          >
            {item.title}
          </h3>
          <p style={{ color: '#6B5D52' }}>{item.description}</p>
        </div>
      </div>
      
      {/* Center Dot */}
      <motion.div
        className="w-6 h-6 rounded-full flex-shrink-0 z-10"
        style={{ 
          background: 'linear-gradient(135deg, #A67B5B 0%, #C8A68E 100%)',
          boxShadow: '0 0 0 6px rgba(166, 123, 91, 0.2)',
        }}
        whileInView={{ scale: [0, 1.2, 1] }}
        viewport={{ once: false }}
        transition={{ duration: 0.5 }}
      />
      
      <div className="flex-1" />
    </motion.div>
  );
}

/**
 * Floating Elements Animation
 */
export function FloatingElement({ 
  children, 
  duration = 6,
  distance = 20,
  delay = 0,
  className = '',
}) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-distance / 2, distance / 2, -distance / 2],
        rotate: [-2, 2, -2],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Reveal on Scroll with custom animation
 */
export function RevealOnScroll({ 
  children, 
  direction = 'up', 
  delay = 0,
  duration = 0.8,
  className = '',
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  });
  
  const directionMap = {
    up: { y: [50, 0] },
    down: { y: [-50, 0] },
    left: { x: [50, 0] },
    right: { x: [-50, 0] },
    scale: { scale: [0.8, 1] },
    rotate: { rotate: [-10, 0], scale: [0.9, 1] },
  };
  
  const animation = directionMap[direction] || directionMap.up;
  const animatedValues = {};
  
  Object.keys(animation).forEach(key => {
    animatedValues[key] = useTransform(scrollYProgress, [0, 0.6], animation[key]);
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
  
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ opacity, ...animatedValues }}
    >
      {children}
    </motion.div>
  );
}

export default StickyCardsSection;
