import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * Calligraphic text with drawing animation effect
 * Simulates hand-drawn text appearance with SVG path animation
 */
export function CalligraphicText({ 
  text, 
  className = '', 
  style = {},
  delay = 0,
  duration = 2.5,
  fontSize = '4rem',
  color = '#A67B5B',
  as = 'div'
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  
  // Generate a unique ID for each text instance
  const pathId = `text-path-${text.replace(/\s/g, '-').toLowerCase()}`;
  const Component = as;
  
  return (
    <Component ref={ref} className={`relative inline-block ${className}`} style={style}>
      {/* Hidden text for accessibility */}
      <span className="sr-only">{text}</span>
      
      {/* Animated SVG text */}
      <svg
        className="overflow-visible"
        style={{ 
          width: '100%', 
          height: 'auto',
          minHeight: fontSize,
        }}
        viewBox="0 0 800 120"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={`${pathId}-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="50%" stopColor="#C8A68E" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        
        {/* Background text (static) */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: "'Great Vibes', cursive",
            fontSize,
            fill: 'rgba(166, 123, 91, 0.1)',
          }}
        >
          {text}
        </text>
        
        {/* Animated drawing text */}
        <motion.text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: "'Great Vibes', cursive",
            fontSize,
            fill: 'none',
            stroke: `url(#${pathId}-gradient)`,
            strokeWidth: 2,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }}
          initial={{ strokeDasharray: 2000, strokeDashoffset: 2000 }}
          animate={isInView ? { 
            strokeDashoffset: 0,
            transition: { 
              duration,
              delay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }
          } : {}}
        >
          {text}
        </motion.text>
        
        {/* Fill animation after stroke */}
        <motion.text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: "'Great Vibes', cursive",
            fontSize,
            fill: color,
          }}
          initial={{ opacity: 0 }}
          animate={isInView ? { 
            opacity: 1,
            transition: { 
              duration: 0.8,
              delay: delay + duration * 0.7,
              ease: "easeOut",
            }
          } : { opacity: 0 }}
        >
          {text}
        </motion.text>
      </svg>
    </Component>
  );
}

/**
 * Word-by-word reveal animation
 */
export function AnimatedWords({ 
  text, 
  className = '',
  style = {},
  delay = 0,
  staggerDelay = 0.08,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  const words = text.split(' ');
  
  return (
    <span ref={ref} className={`inline-block ${className}`} style={style}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 20, rotateX: -90 }}
          animate={isInView ? { 
            opacity: 1, 
            y: 0, 
            rotateX: 0,
            transition: {
              duration: 0.5,
              delay: delay + index * staggerDelay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }
          } : {}}
          style={{ transformOrigin: 'center bottom' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * Letter-by-letter reveal animation
 */
export function AnimatedLetters({ 
  text, 
  className = '',
  style = {},
  delay = 0,
  staggerDelay = 0.03,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  const letters = text.split('');
  
  return (
    <span ref={ref} className={`inline-block ${className}`} style={style}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          className="inline-block"
          initial={{ opacity: 0, y: 50, scale: 0 }}
          animate={isInView ? { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 200,
              damping: 12,
              delay: delay + index * staggerDelay,
            }
          } : {}}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * Typewriter effect
 */
export function TypewriterText({ 
  text, 
  className = '',
  style = {},
  delay = 0,
  speed = 50, // ms per character
  showCursor = true,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [displayText, setDisplayText] = React.useState('');
  
  React.useEffect(() => {
    if (!isInView) return;
    
    let timeout;
    const startTyping = () => {
      let currentIndex = 0;
      const type = () => {
        if (currentIndex <= text.length) {
          setDisplayText(text.slice(0, currentIndex));
          currentIndex++;
          timeout = setTimeout(type, speed);
        }
      };
      timeout = setTimeout(type, delay);
    };
    
    startTyping();
    return () => clearTimeout(timeout);
  }, [isInView, text, delay, speed]);
  
  return (
    <span ref={ref} className={className} style={style}>
      {displayText}
      {showCursor && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{ marginLeft: 2 }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

/**
 * Handwritten underline SVG decoration
 */
export function HandwrittenUnderline({ 
  width = '100%',
  color = '#A67B5B',
  delay = 0,
  duration = 1,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  
  return (
    <svg
      ref={ref}
      viewBox="0 0 300 20"
      style={{ width, height: 'auto', overflow: 'visible' }}
      preserveAspectRatio="none"
    >
      <motion.path
        d="M0 10 Q 50 5, 100 10 T 200 10 T 300 10"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={isInView ? { 
          pathLength: 1, 
          opacity: 1,
          transition: { 
            pathLength: { duration, delay, ease: "easeInOut" },
            opacity: { duration: 0.2, delay }
          }
        } : {}}
      />
    </svg>
  );
}


export default CalligraphicText;
