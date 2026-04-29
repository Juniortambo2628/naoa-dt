import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Heart } from 'lucide-react';
import api from '../services/api';

import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useContent } from '../context/ContentContext';

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { contents, isVisible } = useContent();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('nav.home'), path: '/', section: null },
    { name: t('nav.events'), path: '/programme', section: 'programme_page' },
    { name: t('nav.gifts') || 'Registry', path: '/gifts', section: 'gifts' },
    { name: t('nav.gallery'), path: '/gallery', section: 'gallery' },
    { name: t('nav.songs') || 'Pour Jamz', path: '/songs', section: 'songs_page' },
    { name: t('nav.guestbook') || 'Write to Us', path: '/guestbook', section: 'guestbook_page' },
    { name: 'FAQs', path: '/faq', section: 'faqs' },
    { name: 'Contact', path: '/contact', section: 'contact' },
  ];

  const filteredLinks = navLinks.filter(link => {
    return isVisible(link.section);
  });
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
          isScrolled 
            ? 'py-3' 
            : 'py-5'
        }`}
        style={{
          background: isScrolled 
            ? 'rgba(255, 249, 245, 0.95)' 
            : 'transparent',
          backdropFilter: isScrolled ? 'blur(10px)' : 'none',
          boxShadow: isScrolled ? '0 4px 20px rgba(166, 123, 91, 0.08)' : 'none',
        }}
      >
        <div className="container-wedding flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span 
              className="text-2xl transition-colors"
              style={{ 
                fontFamily: "'Great Vibes', cursive",
                color: '#A67B5B',
              }}
            >
              D&T
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 relative">
            <div className="flex gap-8">
              {filteredLinks.map((link, index) => (
                <Link
                    key={link.path + link.name}
                    to={link.path}
                    className="relative py-2 transition-colors"
                    style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '1rem',
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    color: isActive(link.path) ? '#A67B5B' : '#4A3F35',
                    }}
                >
                    {link.name}
                    {isActive(link.path) && (
                    <motion.span
                        layoutId="navbar-indicator"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                        style={{ background: '#A67B5B' }}
                    />
                    )}
                </Link>
                ))}
            </div>
            
            {isVisible('language_switcher') && (
                <>
                    <div className="h-6 w-px bg-stone-300 mx-2" />
                    <LanguageSwitcher />
                </>
            )}

            {(!contents['rsvp'] || contents['rsvp'].is_visible !== false) && (
                <Link
                    to="/rsvp"
                    className="px-6 py-2 rounded-full font-medium text-sm uppercase tracking-wider transition-all"
                    style={{
                    background: 'linear-gradient(135deg, #A67B5B 0%, #C8A68E 100%)',
                    color: 'white',
                    fontFamily: "'Cormorant Garamond', serif",
                    boxShadow: '0 4px 15px rgba(166, 123, 91, 0.25)',
                    }}
                >
                    {t('nav.rsvp')}
                </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {isVisible('rsvp') && (
                <Link
                    to="/rsvp"
                    className="px-4 py-1.5 rounded-full font-medium text-xs uppercase tracking-wider bg-[#A67B5B] text-white shadow-sm"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                    RSVP
                </Link>
            )}
            {isVisible('language_switcher') && <LanguageSwitcher />}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5"
                style={{ color: '#A67B5B' }}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'linear-gradient(180deg, #FFF9F5 0%, #F8E8E0 100%)' }}
          >
            <div className="flex flex-col items-center justify-center min-h-screen gap-8">
              {filteredLinks.map((link, index) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className="text-4xl transition-colors"
                    style={{
                      fontFamily: "'Great Vibes', cursive",
                      color: isActive(link.path) ? '#A67B5B' : '#4A3F35',
                    }}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Link
                  to="/rsvp"
                  onClick={() => setIsOpen(false)}
                  className="btn-primary mt-8"
                >
                  RSVP Now
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
