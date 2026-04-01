import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Gift, Search, Heart, Check, X, Loader2,
  DollarSign, ShoppingBag, Sparkles, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { giftService, contentService } from '../services/api';
import { 
  MainFlowerTopLeft, 
  MainFlowerBottomRight, 
  FloatingFlower, 
  FlowerDivider,
} from '../components/CustomIllustrations';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Skeleton, CardSkeleton } from '../components/Skeleton';

// Demo gifts
const demoGifts = [
  {
    id: 1,
    name: 'Honeymoon Fund',
    description: 'Help us create unforgettable memories on our honeymoon adventure!',
    category: 'Experience',
    is_cash_fund: true,
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    total_contributions: 50000,
  },
  {
    id: 2,
    name: 'KitchenAid Stand Mixer',
    description: 'The ultimate kitchen companion for our baking adventures together.',
    category: 'Kitchen',
    price: 85000,
    image_url: 'https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?auto=format&fit=crop&w=400&q=80',
    claimed: false,
  },
  {
    id: 3,
    name: 'Dining Set for 8',
    description: 'Beautiful dining set for hosting family and friends.',
    category: 'Home',
    price: 120000,
    image_url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=400&q=80',
    claimed: false,
  },
  {
    id: 4,
    name: 'Luxury Bedding Set',
    description: 'Egyptian cotton sheets and duvet for our bedroom sanctuary.',
    category: 'Bedroom',
    price: 45000,
    image_url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80',
    claimed: true,
  },
  {
    id: 5,
    name: 'Date Night Fund',
    description: 'Contribute to our future date nights and romantic dinners.',
    category: 'Experience',
    is_cash_fund: true,
    image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80',
    total_contributions: 25000,
  },
  {
    id: 6,
    name: 'Coffee Machine',
    description: 'For our morning coffee rituals and lazy Sunday mornings.',
    category: 'Kitchen',
    price: 65000,
    image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80',
    claimed: false,
  },
];

// Helper to resolve dynamic content
const getContent = (content, section, field, i18n, fallbackKey, t) => {
  const val = content?.[section]?.content?.[field];
  if (!val) return t(fallbackKey);
  if (typeof val === 'object') {
    return val[i18n.language] || val['en'] || t(fallbackKey);
  }
  return val;
};

const categories = ['All', 'Kitchen', 'Home', 'Bedroom', 'Experience'];

// Animation variants - optimized
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
};

// Claim Modal Component
function ClaimModal({ gift, onClose, onSubmit }) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onFormSubmit = async (data) => {
    setLoading(true);
    try {
      await giftService.claim(gift.id, {
        name: data.name,
        email: data.email,
        amount: data.amount,
        message: data.message,
      });
      setSuccess(true);
      setTimeout(() => {
        onSubmit();
        onClose();
      }, 2000);
    } catch (err) {
      // Handle error
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(74, 63, 53, 0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md rounded-2xl p-8"
        style={{ background: 'white' }}
        onClick={(e) => e.stopPropagation()}
      >
        {!success ? (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 
                  className="text-2xl"
                  style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
                >
                  {gift.is_cash_fund ? t('gifts.contribute_title') : t('gifts.reserve_title')}
                </h3>
                <p style={{ color: '#6B5D52' }}>{gift.name}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" style={{ color: '#8B7B6B' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
              <div>
                <label className="input-label">{t('gifts.your_name')}</label>
                <input
                  type="text"
                  {...register('name', { required: t('gifts.name_required') })}
                  className="input-field"
                  placeholder={t('gifts.name_placeholder')}
                />
                {errors.name && (
                  <p className="text-sm mt-1" style={{ color: '#DC2626' }}>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="input-label">{t('gifts.email_optional')}</label>
                <input
                  type="email"
                  {...register('email')}
                  className="input-field"
                  placeholder="jane@example.com"
                />
              </div>

              {gift.is_cash_fund && (
                <div>
                  <label className="input-label">{t('gifts.amount_label')}</label>
                  <input
                    type="number"
                    {...register('amount', { 
                      required: t('gifts.amount_required'),
                      min: { value: 100, message: t('gifts.amount_min') }
                    })}
                    className="input-field"
                    placeholder="5000"
                  />
                  {errors.amount && (
                    <p className="text-sm mt-1" style={{ color: '#DC2626' }}>
                      {errors.amount.message}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="input-label">{t('gifts.message_optional')}</label>
                <textarea
                  {...register('message')}
                  rows={3}
                  className="input-field resize-none"
                  placeholder={t('gifts.message_placeholder')}
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : gift.is_cash_fund ? (
                  <>
                    <Heart className="w-5 h-5" />
                    {t('gifts.contribute_action')}
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    {t('gifts.reserve_action')}
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8B9A7D 0%, #9CAF88 100%)' }}
            >
              <Check className="w-10 h-10 text-white" />
            </motion.div>
            <h3 
              className="text-3xl mb-2"
              style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
            >
              {t('gifts.thank_you')}
            </h3>
            <p style={{ color: '#6B5D52' }}>
              {gift.is_cash_fund ? t('gifts.contribution_recorded') : t('gifts.reservation_recorded')}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function GiftRegistry() {
  const { t, i18n } = useTranslation();
  const [gifts, setGifts] = useState(demoGifts);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedGift, setSelectedGift] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    contentService.getAll().then(res => {
        const data = res.data || {};
        // If the section is explicitly hidden, redirect to home
        if (data['gifts']?.is_visible === false) {
           navigate('/');
           return;
        }
        setContent(data);
    }).catch(err => console.error(err));
  }, [navigate]);

  const getTxt = (section, field, fallback) => getContent(content, section, field, i18n, fallback, t);


  useEffect(() => {
    const fetchGifts = async () => {
      setLoading(true);
      try {
        const response = await giftService.getAll();
        const data = response.data || [];
        setGifts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch gifts", err);
      }
      setLoading(false);
    };
    fetchGifts();
  }, []);

  const filteredGifts = gifts.filter((gift) => {
    const matchesSearch = gift.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || gift.category === category;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', { 
      style: 'currency', 
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(price);
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
          {/* Header */}
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
              {getTxt('gifts', 'title', 'gifts.page_title')}
            </h1>
            <p 
              className="text-lg max-w-2xl mx-auto"
              style={{ color: '#6B5D52', fontFamily: "'Cormorant Garamond', serif" }}
            >
              {getTxt('gifts', 'description', 'gifts.page_subtitle')}
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row gap-4 mb-10"
          >
            {/* Search */}
            <div className="relative flex-1">
              <Search 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: '#8B7B6B' }}
              />
              <input
                type="text"
                placeholder={t('gifts.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-12"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`btn-tab ${category === cat ? 'active' : ''}`}
                >
                  {cat === 'All' ? t('gifts.cat_all') : cat}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.1 }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loading ? (
              Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)
            ) : (
              filteredGifts.map((gift) => (
              <motion.div
                key={gift.id}
                variants={staggerItem}
                className="group"
              >
                <div 
                  className="rounded-2xl overflow-hidden transition-all hover:shadow-lg"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(232, 212, 200, 0.5)',
                  }}
                >
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={gift.image_url}
                      alt={gift.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(74, 63, 53, 0.3) 100%)' }}
                    />
                    
                    {/* Category Badge */}
                    <span 
                      className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.95)',
                        color: '#A67B5B',
                      }}
                    >
                      {gift.category}
                    </span>

                    {/* Claimed Badge */}
                    {gift.claimed && (
                      <span 
                        className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          background: 'rgba(139, 154, 125, 0.95)',
                          color: 'white',
                        }}
                      >
                        {t('gifts.reserved_badge')}
                      </span>
                    )}

                    {/* Cash Fund Badge */}
                    {gift.is_cash_fund && (
                      <span 
                        className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                        style={{ 
                          background: 'linear-gradient(135deg, #A67B5B 0%, #C8A68E 100%)',
                          color: 'white',
                        }}
                      >
                        <Sparkles className="w-3 h-3" />
                        {t('gifts.cash_fund_badge')}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 
                      className="text-xl mb-2"
                      style={{ fontFamily: "'Great Vibes', cursive", color: '#4A3F35' }}
                    >
                      {gift.name}
                    </h3>
                    <p 
                      className="text-sm mb-4 line-clamp-2"
                      style={{ color: '#6B5D52' }}
                    >
                      {gift.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      {gift.is_cash_fund ? (
                        <div className="flex items-center gap-2" style={{ color: '#A67B5B' }}>
                          <DollarSign className="w-5 h-5" />
                          <span className="font-medium" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                            {formatPrice(gift.total_contributions || 0)} {t('gifts.raised')}
                          </span>
                        </div>
                      ) : (
                        <span 
                          className="text-lg font-medium"
                          style={{ color: '#A67B5B', fontFamily: "'Cormorant Garamond', serif" }}
                        >
                          {formatPrice(gift.price)}
                        </span>
                      )}
                      
                      <div className="flex gap-2">
                        {gift.product_link && !gift.claimed && (
                            <a 
                                href={gift.product_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn-secondary btn-sm flex items-center gap-1"
                                title="Buy Online"
                            >
                                <ExternalLink className="w-3 h-3" />
                                {t('gifts.btn_buy', 'Buy Online')}
                            </a>
                        )}
                        <button
                            onClick={() => !gift.claimed && setSelectedGift(gift)}
                            disabled={gift.claimed}
                            className={gift.claimed ? 'btn-claimed btn-sm' : 'btn-primary btn-sm'}
                        >
                            {gift.claimed ? t('gifts.btn_reserved') : gift.is_cash_fund ? t('gifts.btn_contribute') : t('gifts.btn_reserve')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                </motion.div>
              ))
            )}
          </motion.div>

          {filteredGifts.length === 0 && (
            <div className="text-center py-16">
              <Gift className="w-16 h-16 mx-auto mb-4" style={{ color: '#D4A59A' }} />
              <p style={{ color: '#6B5D52' }}>{t('gifts.no_results')}</p>
            </div>
          )}
        </div>
      </main>

      {/* Claim Modal */}
      <AnimatePresence>
        {selectedGift && (
          <ClaimModal
            gift={selectedGift}
            onClose={() => setSelectedGift(null)}
            onSubmit={() => {
              // Refresh gifts
            }}
          />
        )}
      </AnimatePresence>
      
      <Footer content={content} />
    </motion.div>
  );
}
