import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Clock, Info, RefreshCw, AlertCircle, 
  Music, GlassWater, Utensils, Camera, Heart, Bell, ChevronRight, ChevronDown, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { scheduleService } from '../services/api';
import PolaroidFeed from '../components/PolaroidFeed';
import { useSmartPolling } from '../hooks/useSmartPolling';
import { 
  MainFlowerTopLeft, 
  MainFlowerBottomRight, 
  FloatingFlower, 
  FlowersCentered
} from '../components/CustomIllustrations';
import { Skeleton, TimelineSkeleton } from '../components/Skeleton';
import Loader from '../components/Loader';
import { staggerContainer, staggerItem } from '../hooks/useScrollAnimation';
import { useContent } from '../context/ContentContext';
import { Navigate } from 'react-router-dom';
import { getWeddingDateText } from '../utils/weddingInfo';
import { formatRange, parseNames } from '../utils/programme';
import StickyPageHeader from '../components/StickyPageHeader';

const iconMap = {
  'Ceremony': Heart,
  'Reception': Utensils,
  'Cocktails': GlassWater,
  'Party': Music,
  'Photos': Camera,
  'Default': Calendar,
};

/**
 * One section of the side panel. Desktop: an accordion row (click the title
 * to open it). Phones: always open, shown when its tab is selected.
 */
function PanelSection({ title, icon, meta = null, open, onToggle, showOnPhone, children }) {
  const Icon = icon;
  return (
    <section className={`border-b last:border-b-0 border-[#E4D6C2]/70 ${showOnPhone ? '' : 'hidden lg:block'}`}>
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="w-full flex items-center gap-3 px-5 py-4 text-left"
        >
          <span className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center" style={{ background: 'rgba(166, 123, 91, 0.1)' }}>
            <Icon className="w-[18px] h-[18px]" style={{ color: '#A67B5B' }} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-lg leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#4A3F35' }}>
              {title}
            </span>
            {meta}
          </span>
          <ChevronDown
            className={`hidden lg:block w-4 h-4 shrink-0 text-stone-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </h3>
      <div className={`px-5 pb-5 ${open ? '' : 'lg:hidden'}`}>{children}</div>
    </section>
  );
}

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
  // Phones show one panel at a time; desktop shows them side by side.
  const [tab, setTab] = useState('programme');
  const [layout, setLayout] = useState({ navH: 72, headerH: 0, stuck: false });
  // Desktop side panel: one section open at a time, so it never needs to scroll.
  const [openPanel, setOpenPanel] = useState('updates');
  const sentinelRef = useRef(null);
  const navigate = useNavigate();
  const { navH, headerH, stuck } = layout;
  const onLayout = useCallback((next) => setLayout(next), []);

  const showTab = (next) => {
    setTab(next);
    // Start the new panel at its top, not wherever the last one was scrolled to.
    const sentinel = sentinelRef.current;
    if (sentinel && stuck) {
      window.scrollTo({ top: sentinel.getBoundingClientRect().top + window.scrollY - navH, behavior: 'instant' });
    }
  };

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
      
      {/* overflow-x-clip (not hidden) so the title bar and side panel can stick */}
      <main className="pt-28 md:pt-32 pb-20 relative overflow-x-clip">
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
          {/* Title and date: pinned under the navbar while scrolling */}
          <StickyPageHeader
            title={getTxt('programme_page', 'title', 'programme.title')}
            subtitle={getWeddingDateText(content, i18n.language, settings)}
            sentinelRef={sentinelRef}
            onLayout={onLayout}
            // Phones: switch between the timeline, updates and notes
            barClassName="lg:hidden"
            bar={(
                <div
                  role="tablist"
                  aria-label="Programme sections"
                  className="lg:hidden mx-auto max-w-sm grid grid-cols-3 gap-1 rounded-full p-1 bg-white/80 border border-[#E4D6C2] shadow-sm"
                >
                  {[
                    { id: 'programme', label: t('programme.tab_timeline', 'Timeline') },
                    { id: 'updates', label: t('programme.tab_updates', 'Updates'), dot: hasNewItems },
                    { id: 'notes', label: t('programme.tab_notes', 'Notes & party') },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={tab === item.id}
                      onClick={() => showTab(item.id)}
                      className={`relative rounded-full px-2 py-2 text-[13px] font-medium transition-colors ${
                        tab === item.id ? 'text-white' : 'text-stone-600'
                      }`}
                    >
                      {tab === item.id && (
                        <motion.span
                          layoutId="programme-tab"
                          className="absolute inset-0 rounded-full"
                          style={{ background: 'linear-gradient(135deg, #A67B5B 0%, #C4A385 100%)' }}
                          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                        />
                      )}
                      <span className="relative">{item.label}</span>
                      {item.dot && tab !== item.id && (
                        <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
            )}
          />

          <div className="grid lg:grid-cols-3 gap-8 mt-6 lg:mt-4">
            {/* Timeline - Left Side */}
            <div className={`lg:col-span-2 relative ${tab === 'programme' ? '' : 'hidden lg:block'}`}>
              {/* Phones: the latest update, one tap from the full list */}
              {!loading && updates.length > 0 && (
                <button
                  type="button"
                  onClick={() => showTab('updates')}
                  className="lg:hidden w-full mb-6 flex items-center gap-3 rounded-2xl px-4 py-3 text-left bg-white/80 border border-[#E4D6C2]"
                >
                  <span className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center" style={{ background: 'rgba(166, 123, 91, 0.1)' }}>
                    <Bell className="w-4 h-4" style={{ color: '#A67B5B' }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]" style={{ color: '#8B7B6B' }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#8B9A7D' }} />
                      {t('programme.latest_update', 'Latest update')}
                    </span>
                    <span className="block truncate text-sm" style={{ color: '#4A3F35' }}>{updates[0].message || updates[0].title}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 shrink-0 text-stone-400" />
                </button>
              )}

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
                        className="relative flex gap-3 sm:gap-6 mb-5 sm:mb-8 last:mb-0"
                      >
                        {/* Timeline Line */}
                        {index < schedule.length - 1 && (
                          <div 
                            className="absolute left-6 sm:left-8 top-14 sm:top-20 w-0.5 h-full -z-10"
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
                          className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center z-10"
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
                            className="w-5 h-5 sm:w-7 sm:h-7"
                            style={{ color: isCurrent || isCompleted ? 'white' : '#A67B5B' }}
                          />
                        </motion.div>
                        
                        {/* Content */}
                        <div 
                          className="flex-1 min-w-0 p-4 sm:p-6 rounded-2xl transition-all"
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
            <aside className="lg:col-span-1" aria-label="Updates and notes">
              {/* Desktop: pinned beside the timeline as one compact card; a
                  section opens at a time so it fits without scrolling. */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:sticky lg:top-(--aside-top) lg:max-h-[calc(100svh-var(--aside-top)-1rem)] lg:overflow-y-auto lg:overscroll-contain rounded-3xl bg-white/90 border border-[#E4D6C2]/80 shadow-[0_12px_40px_rgba(74,63,53,0.08)]"
                style={{ '--aside-top': `${navH + headerH + 12}px` }}
              >
                <PanelSection
                  title={t('programme.live_updates')}
                  icon={Bell}
                  open={openPanel === 'updates'}
                  onToggle={() => setOpenPanel('updates')}
                  showOnPhone={tab === 'updates'}
                  meta={(
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: '#8B7B6B' }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#8B9A7D' }} />
                      {t('programme.real_time')}
                      {hasNewItems && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                    </span>
                  )}
                >
                  <div className="space-y-2.5 lg:max-h-[34svh] lg:overflow-y-auto">
                    {loading ? (
                      Array(2).fill(0).map((_, i) => <Skeleton key={i} variant="text" height="52px" />)
                    ) : updates.length > 0 ? (
                      updates.map((update) => (
                        <motion.div
                          key={update.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="px-4 py-3 rounded-2xl text-[15px] leading-snug"
                          style={{
                            background: update.type === 'important' ? '#6F7F62' : '#8B9A7D',
                            color: '#FBF8F3',
                          }}
                        >
                          {update.message}
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-center py-6 text-sm" style={{ color: '#8B7B6B' }}>
                        {t('programme.no_updates')}
                      </p>
                    )}
                  </div>
                </PanelSection>

                <PanelSection
                  title={t('programme.notes_title')}
                  icon={Info}
                  open={openPanel === 'notes'}
                  onToggle={() => setOpenPanel('notes')}
                  showOnPhone={tab === 'notes'}
                >
                  {settings?.programme_note ? (
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#6B5D52' }}>
                      {settings.programme_note}
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm" style={{ color: '#6B5D52' }}>
                      {['programme.note1', 'programme.note2', 'programme.note3'].map((key) => (
                        <li key={key} className="flex items-start gap-2">
                          <span style={{ color: '#9A7148' }}>•</span>
                          {t(key)}
                        </li>
                      ))}
                    </ul>
                  )}
                </PanelSection>

                {/* Bridal party (Admin → Schedule) */}
                {bridalParty.length > 0 && (
                  <PanelSection
                    title="The Bridal Party"
                    icon={Users}
                    open={openPanel === 'party'}
                    onToggle={() => setOpenPanel('party')}
                    showOnPhone={tab === 'notes'}
                  >
                    <p className="text-xs mb-3" style={{ color: '#8B7B6B' }}>
                      With love and appreciation, we celebrate the bride&apos;s party.
                    </p>
                    <ol className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm" style={{ color: '#4A3F35' }}>
                      {bridalParty.map((name, i) => (
                        <li key={`${name}-${i}`} className="flex items-baseline gap-2">
                          <span className="text-xs tabular-nums" style={{ color: '#9A7148' }}>{String(i + 1).padStart(2, '0')}</span>
                          {name}
                        </li>
                      ))}
                    </ol>
                  </PanelSection>
                )}
              </motion.div>
            </aside>
          </div>
        </div>

        <div className="container-wedding relative z-10">
          <PolaroidFeed />
        </div>
      </main>
      
    </motion.div>
  );
}
