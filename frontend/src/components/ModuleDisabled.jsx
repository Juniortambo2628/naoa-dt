import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { Sparkles, Home, Clock } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ModuleDisabled() {
  const { module } = useParams();
  const moduleName = module ? module.charAt(0).toUpperCase() + module.slice(1).replace('-', ' ') : "This feature";
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #FFF9F5 0%, #F8E8E0 100%)' }}>
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center pt-32 pb-20">
        <div className="container-wedding text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative mb-8">
              <img 
                src="/brain/699ba937-e6f4-425f-9901-986e2064b318/module_disabled_illustration_1777484858633.png" 
                alt="Under Maintenance" 
                className="w-full max-w-md mx-auto rounded-3xl shadow-2xl"
              />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -left-4 bg-[#8B9A7D] text-white p-4 rounded-full shadow-lg"
              >
                <Clock className="w-6 h-6" />
              </motion.div>
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

            <div className="bg-white/50 backdrop-blur-sm border border-stone-200 rounded-2xl p-6 mb-12 flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <Sparkles className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-stone-800">Coming Soon</h3>
                    <p className="text-sm text-stone-500">Check back later for updates. We're working hard on this section!</p>
                </div>
            </div>

            <Link to="/" className="btn-primary inline-flex items-center gap-2">
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
