import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Clock, Info, RefreshCw, AlertCircle, 
  Music, GlassWater, Utensils, Camera, Heart, Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { scheduleService } from '../services/api';
import PolaroidFeed from '../components/PolaroidFeed';
import { useSmartPolling } from '../hooks/useSmartPolling';
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
import { getWeddingDateText } from '../utils/weddingInfo';
import { formatRange, parseNames } from '../utils/programme';
import { SunStrip } from '../components/HeritageMotifs';

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
  const { contents: content, settings, loading: contentLoading, isVisible } = useContent();
  const [schedule, setSchedule] = useState([]);
  const [updates, setUpdates] = useState(demoUpdates);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!contentLoading && !isVisible('programme_page')) {
      navigate('/module-unavailable/programme');
    }
  }, [contentLoading, isVisible, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [scheduleRes, updatesRes] = await Promise.all([
          scheduleService.getTimeline(),
          scheduleService.getLiveUpdates(),
        ]);
        
        if (scheduleRes.data?.length) {
          const allItems = scheduleRes.data.flatMap(event => {
            const items = event.schedule_items || event.scheduleItems || [];
            return items.map(item => ({
              ...item,
              event_name: event.name,
              event_date: event.event_date
            }));
          });
          
          if (allItems.length) {
            const sorted = allItems.sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)) || (a.order ?? 0) - (b.order ?? 0));
            setSchedule(sorted);
          }
        }
        if (updatesRes.data?.length) setUpdates(updatesRes.data);
      } catch (err) {
        console.error('Failed to fetch programme data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Smart polling for live updates
  const fetchUpdates = async () => {
    try {
      const res = await scheduleService.getLiveUpdates();
      if (res.data?.length) setUpdates(res.data);
      return res.data || [];
    } catch {
      return [];
    }
  };

  const { hasNewItems } = useSmartPolling(fetchUpdates, {
    fastInterval: 5000,
    slowInterval: 20000,
    idleAfterMs: 60000,
    onNewItems: (newItems) => {
      setUpdates(prev => {
        const existingIds = new Set(prev.map(u => u.id));
        const fresh = newItems.filter(u => !existingIds.has(u.id));
        return fresh.length ? [...fresh, ...prev] : prev;
      });
    },
  });

  if (contentLoading) {
    return <Loader />;
  }

  if (!isVisible('programme_page')) {
    return null;
  }

  const getTxt = (section, field, fallback) => getContent(content, section, field, i18n, fallback, t);
  const bridalParty = parseNames(settings?.bridal_party);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'linear-gradient(180deg, #FDFAF5 0%, #F3EBDF 100%)', minHeight: '100vh' }}
    >
      
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
        
        {/* The approved long strips, either side of the title (wide screens). */}
        <div className="hidden 2xl:block absolute left-8 top-28 pointer-events-none" aria-hidden="true">
          <SunStrip width={40} height={300} />
        </div>
        <div className="hidden 2xl:block absolute right-8 top-28 pointer-events-none" aria-hidden="true">
          <SunStrip width={40} height={300} />
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
              {getWeddingDateText(content, i18n.language, settings)}
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
                        // Each item reveals itself: they arrive after the list's
                        // own in-view animation has already run.
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        className="relative flex gap-6 mb-8 last:mb-0"
                      >
                        {/* Timeline Line */}
                        {index < schedule.length - 1 && (
                          <div 
                            className="absolute left-8 top-20 w-0.5 h-full -z-10"
                            style={{ 
                              background: isCompleted 
                                ? 'linear-gradient(180deg, #8B9A7D, #C5D4B9)'
                                : 'linear-gradient(180deg, #E4D6C2, #F3EBDF)',
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
                                : 'linear-gradient(135deg, #F3EBDF 0%, #FBF8F3 100%)',
                            border: isCurrent || isCompleted ? 'none' : '2px solid #B8936C',
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
                            border: isCurrent ? '2px solid #A67B5B' : '1px solid rgba(228, 214, 194, 0.5)',
                          }}
                        >
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span 
                              className="text-lg font-medium"
                              style={{ color: '#A67B5B', fontFamily: "'Cormorant Garamond', serif" }}
                            >
                              {formatRange(item)}
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
                          {item.location && (
                            <p
                              className="text-sm flex items-center gap-2"
                              style={{ color: '#8B7B6B' }}
                            >
                              <MapPin className="w-4 h-4" />
                              {item.location}
                            </p>
                          )}
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
                        {hasNewItems && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-1" />
                        )}
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
                              : 'rgba(243, 235, 223, 0.5)',
                            borderLeft: `3px solid ${update.type === 'important' ? '#A67B5B' : '#B8936C'}`,
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
                  style={{ background: 'rgba(184, 147, 108, 0.08)', border: '1px solid rgba(184, 147, 108, 0.35)' }}
                >
                  <h4 
                    className="font-medium mb-4"
                    style={{ color: '#4A3F35', fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {t('programme.notes_title')}
                  </h4>
                  {settings?.programme_note ? (
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#6B5D52' }}>
                      {settings.programme_note}
                    </p>
                  ) : (
                  <ul className="space-y-3 text-sm" style={{ color: '#6B5D52' }}>
                    {['programme.note1', 'programme.note2', 'programme.note3'].map((key) => (
                      <li key={key} className="flex items-start gap-2">
                        <span style={{ color: '#9A7148' }}>•</span>
                        {t(key)}
                      </li>
                    ))}
                  </ul>
                  )}
                </div>

                {/* Bridal party (Admin → Schedule) */}
                {bridalParty.length > 0 && (
                  <div
                    className="mt-6 p-6 rounded-2xl bg-white/80"
                    style={{ border: '1px solid rgba(184, 147, 108, 0.35)' }}
                  >
                    <h4
                      className="font-medium mb-1"
                      style={{ color: '#4A3F35', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.25rem' }}
                    >
                      The Bridal Party
                    </h4>
                    <p className="text-xs mb-4" style={{ color: '#8B7B6B' }}>
                      With love and appreciation, we celebrate the bride&apos;s party.
                    </p>
                    <ol className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm" style={{ color: '#4A3F35' }}>
                      {bridalParty.map((name, i) => (
                        <li key={`${name}-${i}`} className="flex items-baseline gap-2">
                          <span className="text-xs tabular-nums" style={{ color: '#9A7148' }}>{String(i + 1).padStart(2, '0')}</span>
                          {name}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        <div className="container-wedding relative z-10">
          <PolaroidFeed />
        </div>
      </main>
      
    </motion.div>
  );
}
