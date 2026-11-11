import { motion, useReducedMotion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { Hourglass, Home } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import Button from './Button';

const LINE = '#C4A385';

/** Two fine-line rings that draw themselves in, with a twinkle above. No backdrop. */
function OutlineRings() {
  const reduce = useReducedMotion();
  const draw = (delay) => (reduce
    ? {}
    : {
      initial: { pathLength: 0, opacity: 0 },
      animate: { pathLength: 1, opacity: 1 },
      transition: { duration: 1.6, delay, ease: [0.65, 0, 0.35, 1] },
    });
  const ring = { fill: 'none', stroke: LINE, strokeLinecap: 'round' };
  return (
    <svg viewBox="0 0 240 160" className="w-56 sm:w-64 mx-auto" role="img" aria-label="Two wedding rings">
      {/* left ring: outer and inner edge of the band */}
      <motion.circle cx="98" cy="96" r="44" strokeWidth="1.4" {...ring} {...draw(0)} />
      <motion.circle cx="98" cy="96" r="38" strokeWidth="0.7" opacity="0.6" {...ring} {...draw(0.15)} />
      {/* right ring */}
      <motion.circle cx="142" cy="96" r="44" strokeWidth="1.4" {...ring} {...draw(0.35)} />
      <motion.circle cx="142" cy="96" r="38" strokeWidth="0.7" opacity="0.6" {...ring} {...draw(0.5)} />
      {/* a small solitaire where they meet */}
      <motion.path
        d="M120 34 L128 44 L120 56 L112 44 Z M112 44 H128"
        strokeWidth="1.1"
        strokeLinejoin="round"
        {...ring}
        {...draw(1.2)}
      />
      {/* twinkles */}
      {[[120, 18, 6, 2.0], [168, 34, 4, 2.4], [74, 38, 3.5, 2.8]].map(([x, y, r, d]) => (
        <motion.path
          key={`${x}-${y}`}
          d={`M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`}
          fill="none"
          stroke={LINE}
          strokeWidth="0.9"
          initial={{ opacity: 0 }}
          animate={reduce ? { opacity: 0.8 } : { opacity: [0, 0.9, 0.3, 0.9] }}
          transition={reduce ? {} : { duration: 3.2, delay: d, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
      ))}
    </svg>
  );
}

export default function ModuleDisabled() {
  const { module } = useParams();
  const moduleName = module ? module.charAt(0).toUpperCase() + module.slice(1).replace('-', ' ') : "This feature";
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #FDFAF5 0%, #F3EBDF 100%)' }}>
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center pt-32 pb-20">
        <div className="container-wedding text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="mb-6">
              <OutlineRings />
            </div>

            <h1 
              className="text-5xl md:text-6xl mb-6"
              style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
            >
              Patience is a Virtue...
            </h1>
            
            <p 
              className="text-xl mb-8"
              style={{ color: '#6B5D52', fontFamily: "'Cormorant Garamond', serif" }}
            >
              {moduleName} is currently taking a little break. 
              We're polishing things up to make sure everything is perfect for the big day!
            </p>

            <div className="max-w-md mx-auto mb-12 flex items-center gap-4 text-left border-y py-5" style={{ borderColor: 'rgba(196, 163, 133, 0.45)' }}>
              <span className="w-11 h-11 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: LINE, color: '#A67B5B' }}>
                <Hourglass className="w-5 h-5" strokeWidth={1.4} />
              </span>
              <div>
                <h3 className="font-serif text-xl" style={{ color: '#4A3F35' }}>Coming soon</h3>
                <p className="text-sm text-stone-500">Check back later for updates. We&apos;re working hard on this section!</p>
              </div>
            </div>

            <Button as={Link} to="/" variant="secondary" size="lg" icon={Home}>
              Back to Home
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
