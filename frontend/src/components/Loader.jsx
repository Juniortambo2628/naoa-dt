import { motion } from 'framer-motion';
import { Monogram } from './HeritageMotifs';

/** Full-screen loader: the couple's T&D monogram, gently breathing. */
export default function Loader() {
  return (
    <div className="fixed inset-0 bg-[#FAF7F2] z-[100] flex items-center justify-center" role="status" aria-label="Loading">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: [0.55, 1, 0.55], scale: 1 }}
        transition={{
          opacity: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 0.6, ease: 'easeOut' },
        }}
      >
        <Monogram size={84} />
      </motion.div>
    </div>
  );
}
