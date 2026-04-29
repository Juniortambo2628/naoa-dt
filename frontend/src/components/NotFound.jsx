import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Home, ArrowLeft } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #FFF9F5 0%, #F8E8E0 100%)' }}>
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center pt-32 pb-20">
        <div className="container-wedding text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative mb-8">
              <img 
                src="/brain/699ba937-e6f4-425f-9901-986e2064b318/wedding_404_illustration_1777484572308.png" 
                alt="Lost at the Wedding" 
                className="w-full max-w-md mx-auto rounded-3xl shadow-2xl"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-[#A67B5B] text-white p-4 rounded-full shadow-lg"
              >
                <span className="text-2xl font-bold">404</span>
              </motion.div>
            </div>

            <h1 
              className="text-5xl md:text-6xl mb-6"
              style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
            >
              Oops! Even we got lost...
            </h1>
            
            <p 
              className="text-xl mb-12"
              style={{ color: '#6B5D52', fontFamily: "'Cormorant Garamond', serif" }}
            >
              It seems the page you're looking for skipped the ceremony. 
              Don't worry, let's get you back to the main event!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/" className="btn-primary flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />
                Back to Home
              </Link>
              <button 
                onClick={() => window.history.back()}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Go Back
              </button>
            </div>

            <div className="mt-16 flex items-center justify-center gap-2 opacity-30">
              <Heart className="w-4 h-4" fill="#A67B5B" />
              <span className="text-sm font-medium uppercase tracking-widest">Love is the way</span>
              <Heart className="w-4 h-4" fill="#A67B5B" />
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
