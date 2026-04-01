import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, User, Send, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { contentService } from '../services/api';
import api from '../services/api';
import { 
  MainFlowerTopLeft, 
  MainFlowerBottomRight, 
  FlowerDivider,
} from '../components/CustomIllustrations';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Skeleton, MessageSkeleton } from '../components/Skeleton';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4 }
  },
};

export default function Guestbook() {
  const { t } = useTranslation();
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [content, setContent] = useState({});

  const fetchEntries = useCallback(async () => {
    try {
      const res = await api.get('/guestbook');
      setEntries(res.data.entries || []);
    } catch (err) {
      console.error('Failed to fetch guestbook', err);
    }
    setLoading(false);
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    fetchEntries();
    const fetchContentAndCheckVisibility = async () => {
      try {
        const res = await contentService.getAll();
        const data = res.data || {};
        
        // If the section is explicitly hidden, redirect to home
        if (data['guestbook_page']?.is_visible === false) {
           navigate('/');
           return;
        }
        
        setContent(data);
      } catch (err) {
        console.error('Failed to load content', err);
      }
    };
    fetchContentAndCheckVisibility();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchEntries, 30000);
    return () => clearInterval(interval);
  }, [fetchEntries, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/guestbook', {
        guest_name: guestName,
        message: message,
      });
      setSuccess(true);
      setGuestName('');
      setMessage('');
      fetchEntries();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to submit', err);
    }
    setSubmitting(false);
  };

  // Color palette for message cards
  const colors = [
    'from-pink-50 to-rose-50 border-pink-200',
    'from-amber-50 to-orange-50 border-amber-200',
    'from-emerald-50 to-teal-50 border-emerald-200',
    'from-violet-50 to-purple-50 border-violet-200',
    'from-sky-50 to-cyan-50 border-sky-200',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'linear-gradient(180deg, #FFF9F5 0%, #F8E8E0 100%)', minHeight: '100vh' }}
    >
      <Navbar />
      
      <main className="pt-32 pb-20 relative overflow-hidden">
        <MainFlowerTopLeft size={250} />
        <MainFlowerBottomRight size={250} />
        
        <div className="container-wedding relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <FlowerDivider />
            <h1 
              className="text-5xl md:text-6xl mb-4"
              style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
            >
              {t('guestbook.title') || 'Well Wishes'}
            </h1>
            <p 
              className="text-lg"
              style={{ color: '#6B5D52', fontFamily: "'Cormorant Garamond', serif" }}
            >
              {t('guestbook.subtitle') || 'Leave us a message of love and support'}
            </p>
          </motion.div>

          {/* Message Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto mb-16"
          >
            <div className="card-elevated">
              <h2 
                className="text-2xl mb-6 text-center"
                style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
              >
                <Heart className="inline w-6 h-6 mr-2" fill="#A67B5B" />
                {t('guestbook.write_message') || 'Write Your Message'}
              </h2>

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl flex items-center gap-3"
                  style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
                >
                  <Check className="w-5 h-5" />
                  <span>{t('guestbook.success') || 'Thank you for your beautiful message!'}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="input-label flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: '#A67B5B' }} />
                    {t('guestbook.your_name') || 'Your Name'}
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="input-field"
                    placeholder={t('guestbook.name_placeholder') || 'Enter your name'}
                    required
                  />
                </div>

                <div>
                  <label className="input-label flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" style={{ color: '#A67B5B' }} />
                    {t('guestbook.your_message') || 'Your Message'}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="input-field resize-none"
                    placeholder={t('guestbook.message_placeholder') || 'Share your wishes for the couple'}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !guestName.trim() || !message.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {t('guestbook.submit') || 'Send Message'}
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Messages Display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 
              className="text-3xl text-center mb-8"
              style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
            >
              {t('guestbook.messages') || 'Messages from Loved Ones'}
              {entries.length > 0 && (
                <span className="ml-2 text-lg" style={{ color: '#6B5D52' }}>
                  ({entries.length})
                </span>
              )}
            </h2>

            {loading ? (
              <div className="max-w-2xl mx-auto space-y-8 py-10">
                {Array(3).fill(0).map((_, i) => <MessageSkeleton key={i} />)}
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-10" style={{ color: '#6B5D52' }}>
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>{t('guestbook.empty') || 'No messages yet. Be the first to share your wishes!'}</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-8 relative">
                {/* Vertical Thread Line */}
                <div className="absolute left-[27px] top-6 bottom-0 w-0.5 bg-stone-200" />

                <AnimatePresence>
                  {entries.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative flex gap-6"
                    >
                      {/* Avatar Bubble */}
                      <div className="relative z-10 shrink-0">
                        <div 
                          className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-white shadow-md text-xl font-bold"
                          style={{ 
                            background: '#A67B5B',
                            color: 'white',
                            fontFamily: "'Great Vibes', cursive"
                          }}
                        >
                          {entry.guest_name.charAt(0).toUpperCase()}
                        </div>
                      </div>

                      {/* Message Bubble */}
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3 mb-1">
                          <span className="font-bold text-stone-800">{entry.guest_name}</span>
                          <span className="text-xs text-stone-400">{entry.time_ago}</span>
                        </div>
                        <div 
                          className="p-5 rounded-2xl rounded-tl-none shadow-sm relative"
                          style={{ background: 'white' }}
                        >
                          <p 
                            className="text-lg leading-relaxed text-stone-600"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                          >
                            {entry.message}
                          </p>
                          
                          {/* Triangle Tip */}
                          <div 
                            className="absolute top-0 -left-2 w-4 h-4"
                            style={{ 
                              background: 'white',
                              clipPath: 'polygon(100% 0, 0 0, 100% 100%)' 
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer content={content} />
    </motion.div>
  );
}
