import { motion } from 'framer-motion';

export default function Loader() {
  return (
    <div className="fixed inset-0 bg-[#FAF7F2] z-[100] flex items-center justify-center">
      <motion.img
        src="/Naoa-logo.png"
        alt="Loading..."
        className="w-32 h-auto rounded-xl"
        style={{ boxShadow: '0 4px 20px rgba(166, 123, 91, 0.3)' }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}
