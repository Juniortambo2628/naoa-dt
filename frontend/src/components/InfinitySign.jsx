import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * Animated Infinity Sign - Draws as a continuous line
 * Used between couple names in hero section
 */
export function InfinitySign({ 
  size = 120, 
  color = '#A67B5B', 
  strokeWidth = 3,
  delay = 0,
  duration = 2,
  className = '',
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  
  // Infinity path - figure 8 on its side
  const infinityPath = "M50 60 C50 30 80 30 100 60 C120 90 150 90 150 60 C150 30 120 30 100 60 C80 90 50 90 50 60";
  
  return (
    <svg
      ref={ref}
      width={size}
      height={size * 0.6}
      viewBox="0 0 200 120"
      className={className}
      style={{ overflow: 'visible' }}
    >
      {/* Background stroke (faded) */}
      <path
        d={infinityPath}
        fill="none"
        stroke={`${color}20`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      
      {/* Animated drawing stroke */}
      <motion.path
        d={infinityPath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={isInView ? { 
          pathLength: 1, 
          opacity: 1,
        } : { pathLength: 0, opacity: 0 }}
        transition={{ 
          pathLength: { duration, delay, ease: [0.25, 0.46, 0.45, 0.94] },
          opacity: { duration: 0.3, delay }
        }}
      />
      
      {/* Small heart at center */}
      <motion.path
        d="M100 55 C97 50 92 50 92 56 C92 62 100 70 100 70 C100 70 108 62 108 56 C108 50 103 50 100 55"
        fill={color}
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ delay: delay + duration, duration: 0.5, type: "spring" }}
        style={{ transformOrigin: "100px 60px" }}
      />
    </svg>
  );
}

/**
 * Elaborate Line Art Flower - Cosmos style with fine lines
 */
export function LineArtFlower({ 
  size = 200, 
  color = '#A67B5B',
  accentColor = '#E8C4B8',
  className = '',
  style = {},
  showAccentCircle = true,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      style={{ overflow: 'visible', ...style }}
    >
      {/* Accent circle */}
      {showAccentCircle && (
        <motion.circle
          cx="60"
          cy="140"
          r="50"
          fill={accentColor}
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 0.6 } : { scale: 0, opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      )}
      
      {/* Stem */}
      <motion.path
        d="M100 200 Q95 150 100 100"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      
      {/* Main flower petals with line details */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <motion.g
          key={i}
          style={{ transformOrigin: '100px 80px' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
        >
          {/* Petal outline */}
          <path
            d={`M100 80 Q${100 + Math.cos((angle - 20) * Math.PI / 180) * 30} ${80 + Math.sin((angle - 20) * Math.PI / 180) * 30} ${100 + Math.cos(angle * Math.PI / 180) * 55} ${80 + Math.sin(angle * Math.PI / 180) * 55} Q${100 + Math.cos((angle + 20) * Math.PI / 180) * 30} ${80 + Math.sin((angle + 20) * Math.PI / 180) * 30} 100 80`}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
          />
          {/* Petal detail lines */}
          <line
            x1="100"
            y1="80"
            x2={100 + Math.cos(angle * Math.PI / 180) * 45}
            y2={80 + Math.sin(angle * Math.PI / 180) * 45}
            stroke={color}
            strokeWidth="0.8"
            opacity="0.6"
          />
          <line
            x1="100"
            y1="80"
            x2={100 + Math.cos((angle - 10) * Math.PI / 180) * 40}
            y2={80 + Math.sin((angle - 10) * Math.PI / 180) * 40}
            stroke={color}
            strokeWidth="0.5"
            opacity="0.4"
          />
          <line
            x1="100"
            y1="80"
            x2={100 + Math.cos((angle + 10) * Math.PI / 180) * 40}
            y2={80 + Math.sin((angle + 10) * Math.PI / 180) * 40}
            stroke={color}
            strokeWidth="0.5"
            opacity="0.4"
          />
        </motion.g>
      ))}
      
      {/* Flower center */}
      <motion.circle
        cx="100"
        cy="80"
        r="12"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : { scale: 0 }}
        transition={{ delay: 1.3, duration: 0.3 }}
      />
      <motion.circle
        cx="100"
        cy="80"
        r="6"
        fill={color}
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : { scale: 0 }}
        transition={{ delay: 1.4, duration: 0.3 }}
      />
      {/* Center dots */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <motion.circle
          key={i}
          cx={100 + Math.cos(angle * Math.PI / 180) * 8}
          cy={80 + Math.sin(angle * Math.PI / 180) * 8}
          r="1.5"
          fill={color}
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : { scale: 0 }}
          transition={{ delay: 1.5 + i * 0.05, duration: 0.2 }}
        />
      ))}
    </svg>
  );
}

/**
 * Elaborate Corner Floral Decoration
 * Matches the ornate line-art style from reference images
 */
export function FloralCornerDecoration({
  size = 300,
  color = '#A67B5B',
  position = 'top-left',
  className = '',
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });
  
  const getTransform = () => {
    switch (position) {
      case 'top-right': return 'scaleX(-1)';
      case 'bottom-left': return 'scaleY(-1)';
      case 'bottom-right': return 'scale(-1, -1)';
      default: return 'none';
    }
  };
  
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 300 300"
      className={`absolute ${className}`}
      style={{
        [position.includes('top') ? 'top' : 'bottom']: 0,
        [position.includes('left') ? 'left' : 'right']: 0,
        transform: getTransform(),
        overflow: 'visible',
      }}
    >
      {/* Main curved vine */}
      <motion.path
        d="M0 50 Q30 80 50 120 Q70 160 60 200 Q50 240 80 280"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      
      {/* Secondary vine */}
      <motion.path
        d="M30 0 Q60 30 90 50 Q130 70 160 60 Q200 50 240 80"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
      />
      
      {/* Leaves along main vine */}
      {[
        { x: 45, y: 100, angle: -30, scale: 1 },
        { x: 55, y: 150, angle: 20, scale: 0.8 },
        { x: 60, y: 220, angle: -40, scale: 0.9 },
        { x: 30, y: 80, angle: 45, scale: 0.7 },
      ].map((leaf, i) => (
        <motion.g
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: leaf.scale, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ delay: 0.5 + i * 0.15, duration: 0.4 }}
          style={{ transformOrigin: `${leaf.x}px ${leaf.y}px` }}
        >
          <path
            d={`M${leaf.x} ${leaf.y} Q${leaf.x + 15} ${leaf.y - 20} ${leaf.x + 30} ${leaf.y} Q${leaf.x + 15} ${leaf.y + 5} ${leaf.x} ${leaf.y}`}
            fill="none"
            stroke={color}
            strokeWidth="1.2"
            transform={`rotate(${leaf.angle} ${leaf.x} ${leaf.y})`}
          />
          <line
            x1={leaf.x}
            y1={leaf.y}
            x2={leaf.x + 25}
            y2={leaf.y}
            stroke={color}
            strokeWidth="0.8"
            transform={`rotate(${leaf.angle} ${leaf.x} ${leaf.y})`}
          />
        </motion.g>
      ))}
      
      {/* Flower 1 - Peony style */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        style={{ transformOrigin: '80px 60px' }}
      >
        {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((angle, i) => (
          <path
            key={i}
            d={`M80 60 Q${80 + Math.cos((angle - 15) * Math.PI / 180) * 12} ${60 + Math.sin((angle - 15) * Math.PI / 180) * 12} ${80 + Math.cos(angle * Math.PI / 180) * 25} ${60 + Math.sin(angle * Math.PI / 180) * 25} Q${80 + Math.cos((angle + 15) * Math.PI / 180) * 12} ${60 + Math.sin((angle + 15) * Math.PI / 180) * 12} 80 60`}
            fill="none"
            stroke={color}
            strokeWidth="1"
          />
        ))}
        <circle cx="80" cy="60" r="8" fill="none" stroke={color} strokeWidth="1" />
        <circle cx="80" cy="60" r="4" fill={color} />
      </motion.g>
      
      {/* Flower 2 - Lily style */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        style={{ transformOrigin: '180px 70px' }}
      >
        {[30, 90, 150, 210, 270, 330].map((angle, i) => (
          <React.Fragment key={i}>
            <path
              d={`M180 70 Q${180 + Math.cos((angle) * Math.PI / 180) * 15} ${70 + Math.sin((angle) * Math.PI / 180) * 15} ${180 + Math.cos(angle * Math.PI / 180) * 35} ${70 + Math.sin(angle * Math.PI / 180) * 35}`}
              fill="none"
              stroke={color}
              strokeWidth="1.2"
            />
            <line
              x1={180 + Math.cos(angle * Math.PI / 180) * 10}
              y1={70 + Math.sin(angle * Math.PI / 180) * 10}
              x2={180 + Math.cos(angle * Math.PI / 180) * 30}
              y2={70 + Math.sin(angle * Math.PI / 180) * 30}
              stroke={color}
              strokeWidth="0.6"
              opacity="0.5"
            />
          </React.Fragment>
        ))}
        <circle cx="180" cy="70" r="5" fill={color} />
      </motion.g>
      
      {/* Small decorative dots */}
      {[
        { x: 100, y: 40 },
        { x: 140, y: 90 },
        { x: 200, y: 55 },
        { x: 120, y: 130 },
      ].map((dot, i) => (
        <motion.circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r="2"
          fill={color}
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : { scale: 0 }}
          transition={{ delay: 1.2 + i * 0.1, duration: 0.2 }}
        />
      ))}
      
      {/* Delicate curling tendrils */}
      <motion.path
        d="M120 80 Q130 70 140 75 Q145 85 140 95"
        fill="none"
        stroke={color}
        strokeWidth="0.8"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ delay: 1.3, duration: 0.5 }}
      />
      <motion.path
        d="M190 95 Q200 90 205 100 Q200 110 190 108"
        fill="none"
        stroke={color}
        strokeWidth="0.8"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
      />
    </svg>
  );
}

/**
 * Simple elegant leaf for dividers
 */
export function ElegantLeaf({ 
  size = 40, 
  color = '#A67B5B',
  rotation = 0,
  className = '',
}) {
  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 50 30"
      className={className}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path
        d="M0 15 Q15 0 25 15 Q35 30 50 15"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
      <line x1="0" y1="15" x2="50" y2="15" stroke={color} strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

export default InfinitySign;
