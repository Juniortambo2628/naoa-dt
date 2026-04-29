import { motion } from 'framer-motion';

export default function Loader() {
  return (
    <div className="fixed inset-0 bg-[#FAF7F2] z-[100] flex items-center justify-center">
      <div className="flex items-center gap-6 relative">
        <motion.span
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-6xl font-serif text-[#A67B5B]"
          style={{ fontFamily: "'Great Vibes', cursive" }}
        >
          D
        </motion.span>

        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative w-24 h-24 flex items-center justify-center"
        >
          <img 
            src="/illustrations/loader-heart-pulse.png" 
            alt="Loading..." 
            className="w-full h-full object-contain"
          />
        </motion.div>

        <motion.span
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-6xl font-serif text-[#A67B5B]"
          style={{ fontFamily: "'Great Vibes', cursive" }}
        >
          T
        </motion.span>
      </div>
    </div>
  );
}
