import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Users, UtensilsCrossed, MessageSquare, 
  CheckCircle2, Heart, Loader2, AlertCircle, HelpCircle, UserCheck 
} from 'lucide-react';
import { guestService, contentService } from '../services/api';
import { 
  MainFlowerTopLeft, 
  MainFlowerBottomRight, 
  FloatingFlower, 
  FlowerDivider,
  PulsingHeartLogo,
} from '../components/CustomIllustrations';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import { Skeleton } from '../components/Skeleton';
import SpotifySongSearch from '../components/SpotifySongSearch';

// Animation variants - simplified for performance
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  },
  exit: { opacity: 0, y: -15 }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  },
};

// Helper to resolve dynamic content
const getContent = (content, field, i18n, fallbackKey, t) => {
  const val = content?.content?.[field];
  if (!val) return t(fallbackKey);
  if (typeof val === 'object') {
    return val[i18n.language] || val['en'] || t(fallbackKey);
  }
  return val;
};

export default function RSVP() {
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    contentService.getAll().then(res => {
      const data = res.data || {};
      // If the section is explicitly hidden, redirect to home
      if (data['rsvp']?.is_visible === false || data['rsvp_page']?.is_visible === false) {
         navigate('/module-unavailable/rsvp');
         return;
      }
      setContent(data);
    }).catch(err => console.error(err));
  }, [navigate]);

  const getTxt = (field, fallback) => getContent(content?.rsvp, field, i18n, fallback, t);

  const [step, setStep] = useState(0);
  const [guestData, setGuestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showSongRequest, setShowSongRequest] = useState(false);
  const [songRequest, setSongRequest] = useState('');
  const [attending, setAttending] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // Step 0: Find guest by invitation code
  const onCodeSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await guestService.getByCode(data.code);
      const guest = response.data;
      setGuestData(guest);
      
      if (guest.rsvp_status !== 'pending') {
          // If already RSVP'd, show summary
          setStep(2); 
      } else {
          setStep(1);
      }
    } catch (err) {
      setError('Invitation code not found. Please check and try again.');
    }
    setLoading(false);
  };

  // Step 1: Submit RSVP
  const onRsvpSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Submitting RSVP for:', guestData.unique_code, {
        attending: data.attending === 'yes',
        plus_ones_count: parseInt(data.plus_ones) || 0,
        message: data.message,
        song_request: songRequest,
      });
      await guestService.submitRSVP(guestData.unique_code, {
        attending: data.attending === 'yes',
        plus_ones_count: parseInt(data.plus_ones) || 0,
        message: data.message,
        song_request: showSongRequest ? songRequest : '',
      });
      setSubmitted(true);
    } catch (err) {
      console.error('RSVP Submission Error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'linear-gradient(180deg, #FFF9F5 0%, #F8E8E0 100%)', minHeight: '100vh' }}
    >
      <Navbar />
      
      <main className="pt-32 pb-20 relative overflow-hidden">
        {/* Custom flower decorations */}
        <MainFlowerTopLeft size={250} />
        <MainFlowerBottomRight size={250} />
        
        {/* Floating accent flowers */}
        <div className="absolute top-40 right-12 pointer-events-none">
          <FloatingFlower type="secondary-bottom-right" size={80} duration={10} />
        </div>
        <div className="absolute bottom-40 left-12 pointer-events-none">
          <FloatingFlower type="secondary-top-left" size={80} duration={12} delay={1} />
        </div>
        
        <div className="container-wedding relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <FlowerDivider />
            <div 
              className="text-5xl md:text-6xl mb-4"
              style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
            >
                {content ? (
                  getTxt('title', 'rsvp.page_title')
                ) : (
                  <Skeleton variant="text" width="60%" height="48px" className="mx-auto" />
                )}
            </div>
            <div 
              className="text-lg"
              style={{ color: '#6B5D52', fontFamily: "'Cormorant Garamond', serif" }}
            >
              {content ? (
                getTxt('description', 'rsvp.page_subtitle')
              ) : (
                <Skeleton variant="text" width="40%" height="24px" className="mx-auto" />
              )}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key={step}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={scaleIn}
                className="max-w-xl mx-auto"
              >
                <div 
                  className="card-elevated"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 rounded-xl flex items-center gap-3"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626' }}
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {step === 0 ? (
                    // Step 0: Enter Code
                    <form onSubmit={handleSubmit(onCodeSubmit)} className="space-y-8">
                      <div className="text-center">
                        <div 
                          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                          style={{ 
                            background: 'linear-gradient(135deg, #F8E8E0 0%, #FDF5F2 100%)',
                            border: '2px solid #D4A59A',
                          }}
                        >
                          <Heart className="w-8 h-8" style={{ color: '#A67B5B' }} />
                        </div>
                        <h2 
                          className="text-2xl mb-2"
                          style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
                        >
                          {t('rsvp.find_invitation')}
                        </h2>
                        <p style={{ color: '#6B5D52' }}>
                          {t('rsvp.enter_code_desc')}
                        </p>
                      </div>

                      <div>
                        <label className="input-label">{t('rsvp.code_label')}</label>
                        <input
                          type="text"
                          {...register('code', { required: 'Please enter your invitation code' })}
                          className="input-field text-center text-lg tracking-widest uppercase"
                          placeholder="ABCDEF12"
                        />
                        {errors.code && (
                          <p className="mt-2 text-sm" style={{ color: '#DC2626' }}>
                            {errors.code.message}
                          </p>
                        )}
                      </div>

                      <button 
                        type="submit" 
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            {t('rsvp.find_button')}
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : step === 2 ? (
                    // Step 2: RSVP Summary (for existing)
                    <div className="space-y-8 py-4">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-serif text-stone-800">Hi {guestData?.name},</h2>
                            <p className="text-stone-500 mt-1">We already have your RSVP for the wedding!</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-stone-200">
                            <div className="p-4 bg-white rounded-xl border border-stone-100 shadow-sm flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-[#A67B5B]">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-xs text-stone-400 block uppercase tracking-wider font-bold">Status</span>
                                    <span className={`text-sm font-bold uppercase tracking-wider ${guestData?.rsvp_status === 'confirmed' ? 'text-green-600' : 'text-red-500'}`}>
                                        {guestData?.rsvp_status === 'confirmed' ? 'Attending' : 'Declined'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 bg-white rounded-xl border border-stone-100 shadow-sm flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-[#A67B5B]">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-xs text-stone-400 block uppercase tracking-wider font-bold">Plus Ones</span>
                                    <span className="text-sm font-medium text-stone-700">{guestData?.confirmed_plus_ones || 0} extra people</span>
                                </div>
                            </div>

                            {guestData?.rsvp_response?.message && (
                                <div className="col-span-1 sm:col-span-2 p-4 bg-white rounded-xl border border-stone-100 shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-[#A67B5B]">
                                            <MessageSquare className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs text-stone-400 block uppercase tracking-wider font-bold">Your Message</span>
                                    </div>
                                    <p className="text-sm text-stone-700 italic">"{guestData.rsvp_response.message}"</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 pt-4 border-t border-stone-100">
                            <Link to="/faq" className="w-full btn-primary flex justify-center items-center gap-2">
                                <HelpCircle className="w-5 h-5" /> Visit FAQ for More Details
                            </Link>
                            <button 
                                onClick={() => navigate('/')} 
                                className="w-full btn-secondary text-stone-500 hover:text-stone-800"
                            >
                                Return Home
                            </button>
                        </div>
                    </div>
                  ) : (
                    // Step 1: RSVP Form
                    <form onSubmit={handleSubmit(onRsvpSubmit)} className="space-y-8">
                      <div className="text-center">
                        <h2 
                          className="text-3xl mb-2"
                          style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
                        >
                          {t('rsvp.welcome_user', { name: guestData?.name })}
                        </h2>
                        <p style={{ color: '#6B5D52' }}>{t('rsvp.love_to_hear')}</p>
                      </div>

                      {/* Attendance */}
                      <div>
                        <label className="input-label flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" style={{ color: '#A67B5B' }} />
                          {t('rsvp.attending_label')}
                        </label>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          {['yes', 'no'].map((option) => (
                            <label
                              key={option}
                              className="relative cursor-pointer"
                            >
                              <input
                                type="radio"
                                {...register('attending', { required: true })}
                                value={option}
                                onChange={(e) => setAttending(e.target.value)}
                                className="sr-only peer"
                              />
                              <div 
                                className="p-4 rounded-xl text-center transition-all border-2 peer-checked:border-[#A67B5B] peer-checked:bg-[#A67B5B]/5 relative"
                                style={{ borderColor: '#E8D4C8' }}
                              >
                                {/* Checkmark icon - only visible when selected */}
                                <CheckCircle2 
                                  className="absolute top-2 right-2 w-5 h-5 text-[#A67B5B] opacity-0 peer-checked:opacity-100 transition-opacity hidden peer-checked:block" 
                                  style={{ display: 'none' }}
                                />
                                <span 
                                  className="font-medium capitalize"
                                  style={{ color: '#4A3F35', fontFamily: "'Cormorant Garamond', serif" }}
                                >
                                  {option === 'yes' ? t('rsvp.attending_yes') : t('rsvp.attending_no')}
                                </span>
                              </div>
                              {/* Checkmark positioned absolutely over the card */}
                              <div className="absolute top-2 right-2 w-5 h-5 opacity-0 peer-checked:opacity-100 transition-opacity">
                                <CheckCircle2 className="w-5 h-5 text-[#A67B5B]" />
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Song Request Prompt */}
                      {attending === 'yes' && (
                        <div className="bg-[#8B9A7D]/5 p-6 rounded-2xl border border-[#8B9A7D]/10 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[#8B9A7D] text-white">
                                    <Heart className="w-4 h-4" />
                                </div>
                                <p className="text-sm font-medium text-stone-700">
                                    Would you like to dedicate a song to the couple?
                                </p>
                            </div>
                            
                            <div className="flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowSongRequest(true)}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium ${showSongRequest ? 'border-[#8B9A7D] bg-white text-[#8B9A7D]' : 'border-stone-100 bg-white text-stone-500'}`}
                                >
                                    Yes, I have a song!
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => { setShowSongRequest(false); setSongRequest(''); }}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium ${!showSongRequest ? 'border-[#8B5E3C] bg-white text-[#8B5E3C]' : 'border-stone-100 bg-white text-stone-500'}`}
                                >
                                    No, thank you
                                </button>
                            </div>

                            {showSongRequest && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="pt-2"
                                >
                                    <SpotifySongSearch 
                                        value={songRequest}
                                        onChange={setSongRequest}
                                        placeholder="Search for a special song..."
                                    />
                                    <p className="text-[10px] text-stone-400 mt-2 italic px-1">
                                        * Each guest is allowed only 1 request, which cannot be changed after submission.
                                    </p>
                                </motion.div>
                            )}
                        </div>
                      )}
                      {/* Message */}
                      <div>
                        <label className="input-label flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" style={{ color: '#A67B5B' }} />
                          {t('rsvp.message_label')}
                        </label>
                        <textarea
                          {...register('message')}
                          rows={4}
                          className="input-field resize-none"
                          placeholder={t('rsvp.message_placeholder')}
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => { setStep(0); setGuestData(null); }}
                          className="btn-secondary flex-1"
                        >
                          {t('common.back')}
                        </button>
                        <button 
                          type="submit"
                          disabled={loading}
                          className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            t('rsvp.submit_button')
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            ) : (
              // Success State
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl mx-auto text-center"
              >
                <div 
                  className="card-elevated"
                  style={{ background: 'rgba(255, 255, 255, 0.95)' }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center"
                    style={{ 
                      background: 'linear-gradient(135deg, #8B9A7D 0%, #9CAF88 100%)',
                    }}
                  >
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </motion.div>
                  <h2 
                    className="text-4xl mb-4"
                    style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
                  >
                    {t('rsvp.thank_you')}
                  </h2>
                  <p 
                    className="text-lg mb-8"
                    style={{ color: '#6B5D52', fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {t('rsvp.success_message')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/" className="btn-primary">
                      Return Home
                    </Link>
                    <Link to="/faq" className="btn-secondary">
                      View FAQs
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      <Footer content={content} />
    </motion.div>
  );
}
