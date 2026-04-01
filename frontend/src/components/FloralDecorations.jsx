import { motion } from 'framer-motion';

// SVG Leaf Component
const Leaf = ({ className, style, delay = 0, direction = 'left' }) => (
  <motion.svg
    viewBox="0 0 100 150"
    className={className}
    style={style}
    initial={{ 
      opacity: 0, 
      scale: 0,
      rotate: direction === 'left' ? -45 : 45,
    }}
    whileInView={{ 
      opacity: 1, 
      scale: 1,
      rotate: 0,
    }}
    viewport={{ once: false, amount: 0.3 }}
    transition={{ 
      duration: 1.2, 
      delay,
      ease: [0.25, 0.46, 0.45, 0.94]
    }}
  >
    <path
      d="M50 0 C20 30 0 60 10 100 C20 130 40 150 50 150 C60 150 80 130 90 100 C100 60 80 30 50 0"
      fill="#8B9A7D"
      opacity="0.8"
    />
    <path
      d="M50 10 L50 140"
      stroke="#6B7A5D"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M50 40 L30 55 M50 60 L25 80 M50 80 L30 100 M50 100 L35 115"
      stroke="#6B7A5D"
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M50 40 L70 55 M50 60 L75 80 M50 80 L70 100 M50 100 L65 115"
      stroke="#6B7A5D"
      strokeWidth="1.5"
      fill="none"
    />
  </motion.svg>
);

// SVG Flower Component
const Flower = ({ className, style, delay = 0 }) => (
  <motion.svg
    viewBox="0 0 100 100"
    className={className}
    style={style}
    initial={{ opacity: 0, scale: 0, rotate: -180 }}
    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
    viewport={{ once: false, amount: 0.3 }}
    transition={{ duration: 1, delay, ease: "easeOut" }}
  >
    {/* Petals */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
      <ellipse
        key={i}
        cx="50"
        cy="25"
        rx="12"
        ry="20"
        fill="#F8D4D4"
        opacity="0.9"
        transform={`rotate(${angle} 50 50)`}
      />
    ))}
    {/* Center */}
    <circle cx="50" cy="50" r="15" fill="#D4A59A" />
    <circle cx="50" cy="50" r="8" fill="#C8A68E" />
  </motion.svg>
);

// Branch with Leaves
const Branch = ({ className, style, delay = 0, flip = false }) => (
  <motion.svg
    viewBox="0 0 200 300"
    className={className}
    style={{ 
      ...style,
      transform: flip ? 'scaleX(-1)' : 'none',
    }}
    initial={{ opacity: 0, x: flip ? 50 : -50 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: false, amount: 0.2 }}
    transition={{ duration: 1.5, delay, ease: "easeOut" }}
  >
    {/* Main Branch */}
    <motion.path
      d="M180 300 Q150 200 100 150 Q70 120 50 50"
      stroke="#B8A090"
      strokeWidth="3"
      fill="none"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: false }}
      transition={{ duration: 2, delay }}
    />
    
    {/* Leaves on Branch */}
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: false }}
      transition={{ duration: 0.8, delay: delay + 0.5 }}
    >
      <ellipse cx="60" cy="80" rx="15" ry="25" fill="#8B9A7D" opacity="0.8" transform="rotate(-30 60 80)" />
      <ellipse cx="85" cy="120" rx="12" ry="22" fill="#9CAF88" opacity="0.7" transform="rotate(20 85 120)" />
      <ellipse cx="110" cy="160" rx="18" ry="28" fill="#8B9A7D" opacity="0.8" transform="rotate(-15 110 160)" />
      <ellipse cx="130" cy="210" rx="15" ry="25" fill="#9CAF88" opacity="0.7" transform="rotate(25 130 210)" />
    </motion.g>
    
    {/* Small Flowers */}
    <motion.circle
      cx="50"
      cy="50"
      r="8"
      fill="#F8D4D4"
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: false }}
      transition={{ duration: 0.5, delay: delay + 1 }}
    />
    <motion.circle
      cx="75"
      cy="100"
      r="6"
      fill="#E8C4B8"
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: false }}
      transition={{ duration: 0.5, delay: delay + 1.2 }}
    />
  </motion.svg>
);

// Floral Corner Decoration
export const FloralCorner = ({ position = 'top-left', size = 200 }) => {
  const positionStyles = {
    'top-left': { top: 0, left: 0 },
    'top-right': { top: 0, right: 0, transform: 'scaleX(-1)' },
    'bottom-left': { bottom: 0, left: 0, transform: 'scaleY(-1)' },
    'bottom-right': { bottom: 0, right: 0, transform: 'scale(-1, -1)' },
  };

  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex: 10,
        ...positionStyles[position],
      }}
    >
      <Branch 
        style={{ 
          position: 'absolute', 
          width: '100%', 
          height: '100%',
        }}
        delay={0.2}
      />
    </div>
  );
};

// Section Divider with Leaves
export const LeafDivider = ({ delay = 0 }) => (
  <div className="flex items-center justify-center gap-4 my-12">
    <Leaf 
      style={{ width: 30, height: 45 }}
      delay={delay}
      direction="left"
    />
    <motion.div
      className="w-20 h-px bg-gradient-to-r from-transparent via-rose-gold to-transparent"
      style={{ background: 'linear-gradient(90deg, transparent, #C8A68E, transparent)' }}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: false }}
      transition={{ duration: 0.8, delay: delay + 0.2 }}
    />
    <Flower
      style={{ width: 40, height: 40 }}
      delay={delay + 0.3}
    />
    <motion.div
      className="w-20 h-px"
      style={{ background: 'linear-gradient(90deg, transparent, #C8A68E, transparent)' }}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: false }}
      transition={{ duration: 0.8, delay: delay + 0.4 }}
    />
    <Leaf 
      style={{ width: 30, height: 45, transform: 'scaleX(-1)' }}
      delay={delay + 0.5}
      direction="right"
    />
  </div>
);

// Growing Leaves Animation for Scroll
export const GrowingLeaves = ({ side = 'left', count = 3 }) => {
  const leaves = Array.from({ length: count }, (_, i) => ({
    delay: i * 0.2,
    y: 50 + i * 80,
    size: 40 + Math.random() * 20,
    rotation: side === 'left' ? -20 - i * 10 : 20 + i * 10,
  }));

  return (
    <div
      style={{
        position: 'absolute',
        [side]: 0,
        top: 0,
        bottom: 0,
        width: 100,
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {leaves.map((leaf, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            [side]: side === 'left' ? -20 : -20,
            top: leaf.y,
          }}
          initial={{ 
            opacity: 0, 
            scale: 0, 
            rotate: leaf.rotation * 2,
            x: side === 'left' ? -30 : 30,
          }}
          whileInView={{ 
            opacity: 1, 
            scale: 1, 
            rotate: leaf.rotation,
            x: 0,
          }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ 
            duration: 1,
            delay: leaf.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <Leaf 
            style={{ 
              width: leaf.size, 
              height: leaf.size * 1.5,
              transform: side === 'right' ? 'scaleX(-1)' : 'none',
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

export { Leaf, Flower, Branch };
export default FloralCorner;
