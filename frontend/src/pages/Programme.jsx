import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Clock, Info, RefreshCw, AlertCircle, 
  Music, GlassWater, Utensils, Camera, Heart, Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { contentService, scheduleService } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  MainFlowerTopLeft, 
  MainFlowerBottomRight, 
  FloatingFlower, 
  FlowerDivider,
  FlowersCentered
} from '../components/CustomIllustrations';
import { Skeleton, TimelineSkeleton } from '../components/Skeleton';
import Loader from '../components/Loader';
import { fadeInUp, staggerContainer, staggerItem } from '../hooks/useScrollAnimation';
import { useContent } from '../context/ContentContext';
import { Navigate } from 'react-router-dom';

const iconMap = {
  'Ceremony': Heart,
  'Reception': Utensils,
  'Cocktails': GlassWater,
  'Party': Music,
  'Photos': Camera,
  'Default': Calendar,
};

const demoUpdates = [
  { id: 1, title: 'Welcome!', message: 'We are so glad you are here.', time: '2:00 PM' },
];

const getContent = (content, section, field, i18n, fallbackKey, t) => {
  const sectionData = content?.[section]?.content;
  const val = sectionData?.[field];
  
  if (!val) return t(fallbackKey);
  
  // Handle multi-language object
  if (typeof val === 'object') {
    return val[i18n.language] || val['en'] || t(fallbackKey);
  }
  
  // Handle legacy string (assume English or universal)
  return val;
};

export default function Programme() {
  const { t, i18n } = useTranslation();
  const { contents: content, loading: contentLoading, isVisible } = useContent();
  const [schedule, setSchedule] = useState([]);
  const [updates, setUpdates] = useState(demoUpdates);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!contentLoading && !isVisible('programme_page')) {
      navigate('/module-unavailable/programme');
    }
  }, [contentLoading, isVisible, navigate]);

  if (contentLoading) {
    return <Loader />;
  }

  if (!isVisible('programme_page')) {
    return null;
  }

  const getTxt = (section, field, fallback) => getContent(content, section, field, i18n, fallback, t);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [scheduleRes, updatesRes] = await Promise.all([
          scheduleService.getTimeline(),
          scheduleService.getLiveUpdates(),
        ]);
        
        if (scheduleRes.data?.length) {
          // Flatten items from all events
          const allItems = scheduleRes.data.flatMap(event => {
            const items = event.schedule_items || event.scheduleItems || [];
            return items.map(item => ({
              ...item,
              event_name: event.name,
              event_date: event.event_date
            }));
          });
          
          if (allItems.length) {
            // Sort by start_time
            const sorted = allItems.sort((a, b) => a.start_time.localeCompare(b.start_time));
            setSchedule(sorted);
          }
        }
        if (updatesRes.data?.length) setUpdates(updatesRes.data);
      } catch (err) {
        console.error('Failed to fetch programme data', err);
        // Fallback to demo data handled by initial state if needed, 
        // but let's keep it clean
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        <div className="absolute top-40 right-16 pointer-events-none">
          <FloatingFlower type="secondary-bottom-right" size={90} duration={10} />
        </div>
        <div className="absolute bottom-40 left-16 pointer-events-none">
          <FloatingFlower type="secondary-top-left" size={90} duration={12} delay={1} />
        </div>
        
        <div className="container-wedding relative z-10">
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <FlowerDivider />
            <h1 
              className="text-5xl md:text-6xl mb-4"
              style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
            >
              {getTxt('programme_page', 'title', 'programme.title')}
            </h1>
            <p 
              className="text-lg"
              style={{ color: '#6B5D52', fontFamily: "'Cormorant Garamond', serif" }}
            >
              {getTxt('programme_page', 'date', 'hero.date')}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Timeline - Left Side */}
            <div className="lg:col-span-2 relative">
              {/* Decorative centered flowers */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-30">
                <FlowersCentered size={120} />
              </div>
              
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={staggerContainer}
              >
                {loading ? (
                  Array(5).fill(0).map((_, i) => <TimelineSkeleton key={i} />)
                ) : schedule.length > 0 ? (
                  schedule.map((item, index) => {
                    const Icon = iconMap[item.type] || iconMap.Default;
                    const isCurrent = item.status === 'current';
                    const isCompleted = item.status === 'completed';
                    
                    return (
                      <motion.div
                        key={item.id}
                        variants={staggerItem}
                        className="relative flex gap-6 mb-8 last:mb-0"
                      >
                        {/* Timeline Line */}
                        {index < schedule.length - 1 && (
                          <div 
                            className="absolute left-8 top-20 w-0.5 h-full -z-10"
                            style={{ 
                              background: isCompleted 
                                ? 'linear-gradient(180deg, #8B9A7D, #C5D4B9)'
                                : 'linear-gradient(180deg, #E8D4C8, #F8E8E0)',
                            }}
                          />
                        )}
                        
                        {/* Icon */}
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center z-10"
                          style={{ 
                            background: isCurrent 
                              ? 'linear-gradient(135deg, #A67B5B 0%, #C8A68E 100%)'
                              : isCompleted
                                ? 'linear-gradient(135deg, #8B9A7D 0%, #9CAF88 100%)'
                                : 'linear-gradient(135deg, #F8E8E0 0%, #FDF5F2 100%)',
                            border: isCurrent || isCompleted ? 'none' : '2px solid #D4A59A',
                            boxShadow: isCurrent ? '0 8px 30px rgba(166, 123, 91, 0.3)' : '0 4px 15px rgba(0,0,0,0.05)',
                          }}
                        >
                          <Icon 
                            className="w-7 h-7"
                            style={{ color: isCurrent || isCompleted ? 'white' : '#A67B5B' }}
                          />
                        </motion.div>
                        
                        {/* Content */}
                        <div 
                          className="flex-1 p-6 rounded-2xl transition-all"
                          style={{ 
                            background: isCurrent 
                              ? 'rgba(166, 123, 91, 0.08)'
                              : 'rgba(255, 255, 255, 0.7)',
                            border: isCurrent ? '2px solid #A67B5B' : '1px solid rgba(232, 212, 200, 0.5)',
                          }}
                        >
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span 
                              className="text-lg font-medium"
                              style={{ color: '#A67B5B', fontFamily: "'Cormorant Garamond', serif" }}
                            >
                              {item.start_time} - {item.end_time}
                            </span>
                            {isCurrent && (
                              <span 
                                className="badge"
                                style={{ background: 'rgba(166, 123, 91, 0.2)', color: '#A67B5B' }}
                              >
                              {t('programme.happening_now')}
                              </span>
                            )}
                          </div>
                          <h3 
                            className="text-2xl mb-2"
                            style={{ fontFamily: "'Great Vibes', cursive", color: '#4A3F35' }}
                          >
                            {item.title}
                          </h3>
                          <p 
                            className="mb-3"
                            style={{ color: '#6B5D52' }}
                          >
                            {item.description}
                          </p>
                          <p 
                            className="text-sm flex items-center gap-2"
                            style={{ color: '#8B7B6B' }}
                          >
                            <MapPin className="w-4 h-4" />
                            {item.location}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-20 bg-white/50 rounded-3xl border border-stone-100">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-stone-300" />
                    <p className="text-stone-500 font-medium">
                      {t('programme.empty') || 'No events scheduled yet. Check back soon for updates!'}
                    </p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Live Updates - Right Side */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                className="sticky top-32"
              >
                <div 
                  className="card-elevated"
                  style={{ background: 'rgba(255, 255, 255, 0.95)' }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(166, 123, 91, 0.1)' }}
                    >
                      <Bell className="w-5 h-5" style={{ color: '#A67B5B' }} />
                    </div>
                    <div>
                      <h3 
                        className="text-xl"
                        style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
                      >
                        {t('programme.live_updates')}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full animate-pulse"
                          style={{ background: '#8B9A7D' }}
                        />
                        <span className="text-xs" style={{ color: '#8B7B6B' }}>
                          {t('programme.real_time')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {loading ? (
                       Array(2).fill(0).map((_, i) => <Skeleton key={i} variant="text" height="60px" />)
                    ) : updates.length > 0 ? (
                      updates.map((update) => (
                        <motion.div
                          key={update.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 rounded-xl"
                          style={{ 
                            background: update.type === 'important' 
                              ? 'rgba(166, 123, 91, 0.1)'
                              : 'rgba(248, 232, 224, 0.5)',
                            borderLeft: `3px solid ${update.type === 'important' ? '#A67B5B' : '#D4A59A'}`,
                          }}
                        >
                          <p style={{ color: '#4A3F35' }}>{update.message}</p>
                        </motion.div>
                      ))
                    ) : (
                      <p 
                        className="text-center py-8"
                        style={{ color: '#8B7B6B' }}
                      >
                        {t('programme.no_updates')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Important Notes */}
                <div 
                  className="mt-6 p-6 rounded-2xl"
                  style={{ background: 'rgba(139, 154, 125, 0.1)', border: '1px solid #C5D4B9' }}
                >
                  <h4 
                    className="font-medium mb-4"
                    style={{ color: '#4A3F35', fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {t('programme.notes_title')}
                  </h4>
                  <ul className="space-y-3 text-sm" style={{ color: '#6B5D52' }}>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#8B9A7D' }}>•</span>
                      {t('programme.note1')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#8B9A7D' }}>•</span>
                      {t('programme.note2')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#8B9A7D' }}>•</span>
                      {t('programme.note3')}
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </motion.div>
  );
}
