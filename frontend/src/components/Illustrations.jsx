import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

/**
 * Animated Wedding Rings Illustration
 */
export function WeddingRingsIllustration({ size = 200, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
    >
      {/* Left Ring */}
      <motion.ellipse
        cx="75"
        cy="100"
        rx="45"
        ry="50"
        fill="none"
        stroke="#C8A68E"
        strokeWidth="8"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      
      {/* Right Ring */}
      <motion.ellipse
        cx="125"
        cy="100"
        rx="45"
        ry="50"
        fill="none"
        stroke="#A67B5B"
        strokeWidth="8"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
      />
      
      {/* Sparkle */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ delay: 1.8, duration: 0.5, type: "spring" }}
      >
        <polygon
          points="100,20 104,35 120,35 107,45 112,60 100,50 88,60 93,45 80,35 96,35"
          fill="#D4AF37"
        />
      </motion.g>
    </svg>
  );
}

/**
 * Animated Heart with Pulse
 */
export function AnimatedHeart({ size = 100, color = '#D4A59A', className = '' }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      animate={{ 
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <motion.path
        d="M50 88 C20 60 5 35 20 20 C35 5 50 15 50 30 C50 15 65 5 80 20 C95 35 80 60 50 88Z"
        fill={color}
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: false }}
        transition={{ duration: 0.8, type: "spring" }}
      />
    </motion.svg>
  );
}

/**
 * Animated Love Birds
 */
export function LoveBirdsIllustration({ size = 300, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  
  return (
    <svg
      ref={ref}
      width={size}
      height={size * 0.6}
      viewBox="0 0 300 180"
      className={className}
    >
      {/* Branch */}
      <motion.path
        d="M20 140 Q 80 120, 150 130 T 280 120"
        fill="none"
        stroke="#8B7355"
        strokeWidth="6"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      
      {/* Left Bird */}
      <motion.g
        initial={{ x: -50, opacity: 0 }}
        animate={isInView ? { x: 0, opacity: 1 } : { x: -50, opacity: 0 }}
        transition={{ delay: 0.8, duration: 0.8, type: "spring" }}
      >
        <ellipse cx="100" cy="105" rx="25" ry="20" fill="#D4A59A" />
        <circle cx="110" cy="95" r="12" fill="#D4A59A" />
        <circle cx="113" cy="93" r="3" fill="#4A3F35" />
        <path d="M120 95 L130 92 L120 98" fill="#A67B5B" />
        <ellipse cx="85" cy="110" rx="15" ry="8" fill="#E8C4B8" />
      </motion.g>
      
      {/* Right Bird */}
      <motion.g
        initial={{ x: 50, opacity: 0 }}
        animate={isInView ? { x: 0, opacity: 1 } : { x: 50, opacity: 0 }}
        transition={{ delay: 1, duration: 0.8, type: "spring" }}
      >
        <ellipse cx="200" cy="100" rx="25" ry="20" fill="#C8A68E" />
        <circle cx="190" cy="90" r="12" fill="#C8A68E" />
        <circle cx="187" cy="88" r="3" fill="#4A3F35" />
        <path d="M180 90 L170 87 L180 93" fill="#A67B5B" />
        <ellipse cx="215" cy="105" rx="15" ry="8" fill="#D4A59A" />
      </motion.g>
      
      {/* Heart between birds */}
      <motion.path
        d="M150 75 C145 70 138 70 138 78 C138 85 150 95 150 95 C150 95 162 85 162 78 C162 70 155 70 150 75"
        fill="#D4A59A"
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { 
          scale: [0, 1.2, 1],
          opacity: 1,
        } : { scale: 0, opacity: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        style={{ transformOrigin: "150px 82px" }}
      />
      
      {/* Leaves */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 1.8, duration: 0.5 }}
      >
        <ellipse cx="50" cy="135" rx="8" ry="15" fill="#8B9A7D" transform="rotate(-30 50 135)" />
        <ellipse cx="70" cy="128" rx="6" ry="12" fill="#9CAF88" transform="rotate(20 70 128)" />
        <ellipse cx="230" cy="118" rx="8" ry="15" fill="#8B9A7D" transform="rotate(30 230 118)" />
        <ellipse cx="250" cy="125" rx="6" ry="12" fill="#9CAF88" transform="rotate(-20 250 125)" />
      </motion.g>
    </svg>
  );
}

/**
 * Wedding Cake Illustration
 */
export function WeddingCakeIllustration({ size = 200, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
    >
      {/* Bottom Tier */}
      <motion.rect
        x="30" y="140" width="140" height="40"
        rx="5"
        fill="#FDF5F2"
        stroke="#E8D4C8"
        strokeWidth="2"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={isInView ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ transformOrigin: "100px 180px" }}
      />
      
      {/* Middle Tier */}
      <motion.rect
        x="50" y="100" width="100" height="40"
        rx="5"
        fill="#FDF5F2"
        stroke="#E8D4C8"
        strokeWidth="2"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={isInView ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
        style={{ transformOrigin: "100px 140px" }}
      />
      
      {/* Top Tier */}
      <motion.rect
        x="70" y="60" width="60" height="40"
        rx="5"
        fill="#FDF5F2"
        stroke="#E8D4C8"
        strokeWidth="2"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={isInView ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
        style={{ transformOrigin: "100px 100px" }}
      />
      
      {/* Decorations */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        {/* Flowers */}
        <circle cx="60" cy="155" r="6" fill="#D4A59A" />
        <circle cx="100" cy="155" r="6" fill="#D4A59A" />
        <circle cx="140" cy="155" r="6" fill="#D4A59A" />
        <circle cx="75" cy="115" r="5" fill="#C8A68E" />
        <circle cx="125" cy="115" r="5" fill="#C8A68E" />
        <circle cx="100" cy="75" r="5" fill="#A67B5B" />
      </motion.g>
      
      {/* Topper */}
      <motion.g
        initial={{ y: -20, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { y: -20, opacity: 0 }}
        transition={{ delay: 1.2, duration: 0.5, type: "spring" }}
      >
        <path
          d="M100 45 C95 40 88 40 88 48 C88 55 100 65 100 65 C100 65 112 55 112 48 C112 40 105 40 100 45"
          fill="#A67B5B"
        />
      </motion.g>
    </svg>
  );
}

/**
 * Champagne Toast Illustration
 */
export function ChampagneToastIllustration({ size = 180, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 180 180"
      className={className}
    >
      {/* Left Glass */}
      <motion.g
        initial={{ rotate: 20, x: 30, opacity: 0 }}
        animate={isInView ? { rotate: 0, x: 0, opacity: 1 } : { rotate: 20, x: 30, opacity: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        style={{ transformOrigin: "60px 150px" }}
      >
        <path
          d="M45 50 L40 100 L55 105 L55 140 L45 145 L75 145 L65 140 L65 105 L80 100 L75 50 Z"
          fill="#FDF5F2"
          stroke="#D4A59A"
          strokeWidth="2"
        />
        <ellipse cx="60" cy="50" rx="17" ry="6" fill="#F7E8D0" stroke="#D4A59A" strokeWidth="2" />
      </motion.g>
      
      {/* Right Glass */}
      <motion.g
        initial={{ rotate: -20, x: -30, opacity: 0 }}
        animate={isInView ? { rotate: 0, x: 0, opacity: 1 } : { rotate: -20, x: -30, opacity: 0 }}
        transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
        style={{ transformOrigin: "120px 150px" }}
      >
        <path
          d="M105 50 L100 100 L115 105 L115 140 L105 145 L135 145 L125 140 L125 105 L140 100 L135 50 Z"
          fill="#FDF5F2"
          stroke="#C8A68E"
          strokeWidth="2"
        />
        <ellipse cx="120" cy="50" rx="17" ry="6" fill="#F7E8D0" stroke="#C8A68E" strokeWidth="2" />
      </motion.g>
      
      {/* Bubbles */}
      {[
        { cx: 55, cy: 70, r: 3, delay: 1 },
        { cx: 65, cy: 85, r: 2, delay: 1.2 },
        { cx: 58, cy: 95, r: 2, delay: 1.1 },
        { cx: 115, cy: 75, r: 3, delay: 1.3 },
        { cx: 125, cy: 88, r: 2, delay: 1.4 },
        { cx: 118, cy: 92, r: 2, delay: 1.5 },
      ].map((bubble, i) => (
        <motion.circle
          key={i}
          cx={bubble.cx}
          cy={bubble.cy}
          r={bubble.r}
          fill="white"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { 
            opacity: [0, 1, 0],
            y: [20, -10],
          } : { opacity: 0 }}
          transition={{ 
            delay: bubble.delay,
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        />
      ))}
      
      {/* Sparkles */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <polygon points="90,25 92,32 100,32 94,37 96,45 90,40 84,45 86,37 80,32 88,32" fill="#D4AF37" />
      </motion.g>
    </svg>
  );
}

/**
 * Wedding Bouquet Illustration
 */
export function BouquetIllustration({ size = 200, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
    >
      {/* Ribbon/Handle */}
      <motion.path
        d="M85 140 Q100 150 115 140 L110 180 Q100 185 90 180 Z"
        fill="#C8A68E"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={isInView ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{ transformOrigin: "100px 160px" }}
      />
      
      {/* Leaves Background */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        style={{ transformOrigin: "100px 100px" }}
      >
        <ellipse cx="60" cy="100" rx="12" ry="25" fill="#8B9A7D" transform="rotate(-30 60 100)" />
        <ellipse cx="140" cy="100" rx="12" ry="25" fill="#8B9A7D" transform="rotate(30 140 100)" />
        <ellipse cx="75" cy="70" rx="10" ry="20" fill="#9CAF88" transform="rotate(-20 75 70)" />
        <ellipse cx="125" cy="70" rx="10" ry="20" fill="#9CAF88" transform="rotate(20 125 70)" />
      </motion.g>
      
      {/* Flowers */}
      {[
        { cx: 100, cy: 80, r: 25, color: '#F8D4D4', delay: 0.5 },
        { cx: 70, cy: 95, r: 20, color: '#FDF5F2', delay: 0.6 },
        { cx: 130, cy: 95, r: 20, color: '#FDF5F2', delay: 0.7 },
        { cx: 85, cy: 115, r: 18, color: '#E8C4B8', delay: 0.8 },
        { cx: 115, cy: 115, r: 18, color: '#E8C4B8', delay: 0.9 },
        { cx: 100, cy: 50, r: 18, color: '#D4A59A', delay: 1.0 },
      ].map((flower, i) => (
        <motion.g
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ delay: flower.delay, duration: 0.4, type: "spring" }}
          style={{ transformOrigin: `${flower.cx}px ${flower.cy}px` }}
        >
          {/* Petals */}
          {[0, 60, 120, 180, 240, 300].map((angle, j) => (
            <ellipse
              key={j}
              cx={flower.cx + Math.cos(angle * Math.PI / 180) * flower.r * 0.6}
              cy={flower.cy + Math.sin(angle * Math.PI / 180) * flower.r * 0.6}
              rx={flower.r * 0.4}
              ry={flower.r * 0.6}
              fill={flower.color}
              transform={`rotate(${angle} ${flower.cx + Math.cos(angle * Math.PI / 180) * flower.r * 0.6} ${flower.cy + Math.sin(angle * Math.PI / 180) * flower.r * 0.6})`}
            />
          ))}
          {/* Center */}
          <circle cx={flower.cx} cy={flower.cy} r={flower.r * 0.3} fill="#D4A59A" />
        </motion.g>
      ))}
    </svg>
  );
}

export default WeddingCakeIllustration;
