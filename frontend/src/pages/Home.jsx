import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Heart, Gift, Clock, Users, ChevronDown, Sparkles } from 'lucide-react';
import { getAssetUrl, polaroidService, galleryService } from '../services/api';
import { getWeddingDateText, getWeddingDate, getCoupleNames } from '../utils/weddingInfo';
// FloralDecorations import removed - using CustomIllustrations instead
import { CalligraphicText, AnimatedWords, HandwrittenUnderline } from '../components/CalligraphicText';
import { ParallaxImage, FloatingElement, RevealOnScroll } from '../components/StickyCards';
import { SealStamp, CloudLine } from '../components/HeritageMotifs';
import { 
  MaleIcon, 
  FemaleIcon, 
  MainFlowerTopLeft, 
  MainFlowerBottomRight,
  FloatingFlower,
  CenteredFlower,
  FlowersCentered,
  FlowerColorCircles,
  FlowerDivider,
} from '../components/CustomIllustrations';
import { fadeInUp, staggerContainer, staggerItem, scaleIn } from '../hooks/useScrollAnimation';
import { Skeleton } from '../components/Skeleton';
import Button from '../components/Button';
import GuestNotices from '../components/GuestNotices';
import { visibleGuestNotices } from '../utils/guestNotices';
import { useContent } from '../context/ContentContext';

// Polaroid Floating Image Component
function PolaroidFloatingImage({ src, size = 160, duration = 10, delay = 0, rotate = 0, note = '', customSize, offsetX, offsetY, customRotation }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: [0, -10, 0],
        rotate: [rotate, rotate + 2, rotate]
      }}
      transition={{
        opacity: { duration: 0.8, delay },
        y: { duration: duration, repeat: Infinity, ease: "easeInOut", delay },
        rotate: { duration: duration * 1.2, repeat: Infinity, ease: "easeInOut", delay }
      }}
      className="bg-white p-3 pb-8 shadow-xl rounded-sm"
      style={{ 
        width: customSize || size,
        transform: `translate(${offsetX || 0}px, ${offsetY || 0}px) rotate(${customRotation || rotate}deg)`,
        position: 'relative'
      }}
    >
      <div className="bg-stone-100 w-full aspect-square overflow-hidden mb-3">
        <img src={src} alt="Polaroid" className="w-full h-full object-cover" />
      </div>
      {note && (
        <p className="text-center font-handwritten text-[#A67B5B] text-sm italic" style={{ fontFamily: "'Great Vibes', cursive" }}>
          {note}
        </p>
      )}
    </motion.div>
  );
}

// Helper to resolve dynamic content
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

/** A fine-line heart that draws itself in, then breathes gently. */
function LineHeart() {
  return (
    <motion.svg
      viewBox="0 0 48 44"
      className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14"
      fill="none"
      aria-hidden="true"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.6 }}
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ scale: { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 1.8 } }}
    >
      <motion.path
        d="M24 40C24 40 5 28.5 3.4 16.6 2.3 8.6 7.6 3.5 13.8 3.5 18.3 3.5 21.6 6.2 24 10.2 26.4 6.2 29.7 3.5 34.2 3.5 40.4 3.5 45.7 8.6 44.6 16.6 43 28.5 24 40 24 40Z"
        stroke="#C4A385"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{ hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1 } }}
        transition={{ duration: 1.6, ease: 'easeInOut' }}
      />
      <motion.path
        d="M24 33C24 33 11.5 25 10.4 17.2 9.7 12.3 12.9 9.2 16.6 9.2"
        stroke="#C4A385"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.6"
        variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
        transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.6 }}
      />
    </motion.svg>
  );
}

/** One of the couple: portrait in a fine double ring, name, optional role. */
function CouplePortrait({ image, name, role, alt, loading, from }) {
  return (
    <motion.div
      className="text-center min-w-0"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, ease: 'easeOut', delay: from === 'right' ? 0.15 : 0 }}
    >
      <div className="relative mx-auto mb-3 sm:mb-4 w-[120px] h-[120px] sm:w-[176px] sm:h-[176px] md:w-[240px] md:h-[240px]">
        <div className="absolute -inset-1.5 sm:-inset-2.5 rounded-full border" style={{ borderColor: 'rgba(196, 163, 133, 0.9)' }} />
        <div className="absolute -inset-3 sm:-inset-5 rounded-full border" style={{ borderColor: 'rgba(196, 163, 133, 0.35)' }} />
        <div className="w-full h-full rounded-full overflow-hidden bg-stone-100">
          {image ? (
            <img src={getAssetUrl(image)} alt={alt} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <Skeleton variant="image" width="100%" height="100%" />
          )}
        </div>
      </div>
      <h3
        className="text-3xl sm:text-4xl mt-4 mb-1 truncate"
        style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
      >
        {loading ? <Skeleton variant="text" width="110px" height="36px" className="mx-auto" as="span" /> : name}
      </h3>
      {!loading && role && (
        <p className="text-sm sm:text-base" style={{ color: '#6B5D52', fontFamily: "'Cormorant Garamond', serif" }}>{role}</p>
      )}
    </motion.div>
  );
}

// Hero Section with Horizontal Names, Female/Male Icons, and Infinity Sign
function HeroSection({ content, settings, loading }) {
  const { t, i18n } = useTranslation();
  const getTxt = (field, fallback) => getContent(content, 'home_hero', field, i18n, fallback, t);
  const { brideName, groomName } = getCoupleNames(settings, content, i18n.language);
  const hasNotices = visibleGuestNotices(settings?.guest_notices).length > 0;

  const ref = useRef(null);
  // Reveal once. The hero used to replay its entrance every time it came back
  // into view and drift/fade with the scroll (parallax), which stuttered on
  // phones (iOS Safari especially); now it scrolls like normal content.
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const animationKey = 0;

  return (
    <section ref={ref} className="relative min-h-[100svh] flex items-center justify-center pt-28 pb-20 md:pt-28 md:pb-12 overflow-hidden" style={{ zIndex: 50 }}>
      {/* Top padding (pt-28) clears the fixed navbar (~96px) so the subtitle never sits under it on phones or short screens.
          svh (not dvh): the height must not change while Safari's toolbar collapses mid-scroll. */}
      {/* Soft gradient background */}
      <div 
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #FFFDF9 0%, #FBF8F3 50%, #FDFAF5 100%)' }}
      />
      
      {/* Custom Flower Corners */}
      {/* Blended in behind the header logo, softer and smaller on phones */}
      <MainFlowerTopLeft size={350} className="w-48 opacity-40 md:w-auto md:opacity-100" />
      {/* Phones: only the top corner, so the pattern never sits behind the notices. */}
      <MainFlowerBottomRight size={350} className="hidden md:block" />

      {/* The bride's Africa map, barely there behind the names */}
      <img
        src="/illustrations/africa-map.png"
        alt=""
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,620px)] h-auto pointer-events-none select-none"
        style={{ opacity: 0.025 }}
      />
      
      {/* Hero Content */}
      <motion.div 
        className="relative z-20 text-center px-4 max-w-6xl mx-auto"
      >
        {/* (The T&D monogram now sits in the header, in place of the platform logo.) */}
        {/* "We're Getting Married" subtitle */}
        <motion.div
          key={`subtitle-${animationKey}`}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-base sm:text-lg md:text-xl mb-6 md:mb-8 tracking-[0.18em] sm:tracking-[0.3em] uppercase"
          style={{ color: '#8B7B6B', fontFamily: "'Cormorant Garamond', serif" }}
        >
          {loading ? (
            <Skeleton variant="text" width="60%" height="24px" className="mx-auto" as="span" />
          ) : (
            getTxt('subtitle', 'hero.getting_married')
          )}
        </motion.div>
        
        {/* Horizontal Names with Icons and Infinity Sign */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-8 md:mb-10">
          {/* Dinah Group */}
          <div className="flex items-center gap-3">
            <motion.div
              key={`female-icon-${animationKey}`}
              initial={{ opacity: 0, x: -5, scale: 0.8 }}
              animate={isInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -5, scale: 0.8 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <FemaleIcon size={40} className="w-12 h-12 md:w-24 md:h-24" animate={false} />
            </motion.div>
            <motion.h1
              key={`dinah-${animationKey}`}
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-5xl md:text-7xl lg:text-8xl"
              style={{ 
                fontFamily: "'Great Vibes', cursive", 
                color: '#A67B5B',
                lineHeight: 1.1,
              }}
            >
              {loading ? <Skeleton variant="text" width="150px" height="60px" as="span" /> : brideName}
            </motion.h1>
          </div>
          
          {/* 囍 seal between the names: a quiet nod to the groom's culture */}
          <motion.div
            key={`seal-${animationKey}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <SealStamp size={30} className="md:scale-125" />
          </motion.div>

          {/* Tze Ren Group */}
          <div className="flex items-center gap-3">
            <motion.h1
              key={`tzeren-${animationKey}`}
              initial={{ opacity: 0, x: 10 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="text-5xl md:text-7xl lg:text-8xl"
              style={{ 
                fontFamily: "'Great Vibes', cursive", 
                color: '#A67B5B',
                lineHeight: 1.1,
              }}
            >
              {loading ? <Skeleton variant="text" width="200px" height="60px" as="span" /> : groomName}
            </motion.h1>
            <motion.div
              key={`male-icon-${animationKey}`}
              initial={{ opacity: 0, x: 5, scale: 0.8 }}
              animate={isInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 5, scale: 0.8 }}
              transition={{ duration: 0.8, delay: 1.8 }}
            >
              <MaleIcon size={40} className="w-12 h-12 md:w-24 md:h-24" animate={false} />
            </motion.div>
          </div>
        </div>
        
        {/* Decorative underline */}
        <motion.div
          key={`underline-${animationKey}`}
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ delay: 2.8, duration: 1, ease: "easeOut" }}
          className="mx-auto mb-8 md:mb-10 origin-center flex justify-center"
        >
          <CloudLine width={256} className="w-48 md:w-64 h-auto" />
        </motion.div>
        
        {/* Date & Venue */}
        <motion.div
          key={`date-${animationKey}`}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 3, duration: 0.8 }}
          className="mb-12"
        >
          <p 
            className="text-2xl md:text-3xl mb-4 font-medium"
            style={{ color: '#4A3F35', fontFamily: "'Cormorant Garamond', serif" }}
          >
            {loading ? <Skeleton variant="text" width="250px" height="30px" className="mx-auto" as="span" /> : getWeddingDateText(content, i18n.language, settings)}
          </p>
          <p className="flex items-center justify-center gap-2 text-lg md:text-xl" style={{ color: '#6B5D52' }}>
            <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: '#A67B5B' }} />
            {loading ? <Skeleton variant="text" width="300px" height="24px" as="span" /> : (settings?.venue_name
              ? [settings.venue_name, settings.venue_address].filter(Boolean).join(', ')
              : getTxt('location', 'hero.location'))}
          </p>
        </motion.div>

        {/* Guest notices take the CTA slot when any are switched on — the
            RSVP button is already in the navbar, so the hero gives the room
            to the notices. Otherwise fall back to the RSVP CTA. */}
        <motion.div
          key={`cta-${animationKey}`}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 3.3, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {hasNotices ? (
            <GuestNotices notices={settings?.guest_notices} variant="hero" />
          ) : (
            <Button as={Link} to="/rsvp" variant="secondary" size="lg">
              {t('hero.rsvp_cta')}
            </Button>
          )}
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="w-8 h-8" style={{ color: '#A67B5B' }} />
      </motion.div>
    </section>
  );
}

// Countdown Section with Animated Numbers
function CountdownSection({ content, settings, loading: cmsLoading }) {
  const { t, i18n } = useTranslation();
  const getTxt = (field, fallback) => getContent(content, 'countdown', field, i18n, fallback, t);
  
  // Get wedding date from CMS or use fallback
  const weddingDateStr = getWeddingDate(settings, content);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Safe parsing
  const getDiff = () => {
      try {
          const target = new Date(weddingDateStr).getTime();
          if (isNaN(target)) throw new Error("Invalid Date");
          return target - new Date().getTime();
      } catch (e) {
          console.error("Countdown Error:", e);
          return 0;
      }
  };
  
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = getDiff();
      
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart the countdown only when the wedding date changes
  }, [weddingDateStr]);


  const countdownItems = [
    { value: timeLeft.days, label: t('countdown.days') },
    { value: timeLeft.hours, label: t('countdown.hours') },
    { value: timeLeft.minutes, label: t('countdown.minutes') },
    { value: timeLeft.seconds, label: t('countdown.seconds') },
  ];

  return (
    <section className="section relative" style={{ background: '#FBF8F3', zIndex: 40 }}>
      <div className="container-wedding relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="text-center"
        >
          <FlowerDivider />
          
          <motion.div variants={fadeInUp} className="mb-4">
            {cmsLoading ? (
              <Skeleton variant="text" width="300px" height="48px" className="mx-auto" as="span" />
            ) : (
              <CalligraphicText 
                text={getTxt('title', 'countdown.title')} 
                fontSize="3.5rem"
                duration={2}
              />
            )}
          </motion.div>
          
          <motion.p
            variants={fadeInUp}
            className="text-xl mb-14"
            style={{ color: '#6B5D52', fontFamily: "'Cormorant Garamond', serif" }}
          >
            {cmsLoading ? <Skeleton variant="text" width="400px" className="mx-auto" as="span" /> : getTxt('subtitle', 'countdown.subtitle')}
          </motion.p>
          
          <motion.div 
            variants={staggerContainer}
            className="flex justify-center gap-4 md:gap-10 flex-wrap"
          >
            {countdownItems.map((item, _index) => (
              <motion.div 
                key={item.label}
                variants={scaleIn}
                className="text-center w-24 md:w-32 flex flex-col items-center"
              >
                <motion.span 
                  className="text-5xl md:text-6xl font-light opacity-90"
                  style={{ color: '#4A3F35', fontFamily: "'Cormorant Garamond', serif" }}
                  key={item.value}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {String(item.value).padStart(2, '0')}
                </motion.span>
                <div className="w-8 h-[1px] bg-[#B8936C]/50 my-4"></div>
                <span 
                  className="text-xs md:text-sm uppercase tracking-[0.25em]"
                  style={{ color: '#8B7B6B' }}
                >
                  {item.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// Story Section with Love Birds and Interactive Elements
function StorySection({ content, settings, loading: cmsLoading }) {
  const { t, i18n } = useTranslation();
  const getTxt = (field, fallback) => getContent(content, 'our_story', field, i18n, fallback, t);
  const { brideName, groomName } = getCoupleNames(settings, content, i18n.language);

  const ref = useRef(null);

  return (
    <section ref={ref} className="section relative" style={{ background: '#FFFEF8', zIndex: 30 }}>
      <div className="container-wedding relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          variants={staggerContainer}
        >
          <div className="text-center mb-16">
            <FlowerDivider />
            <motion.div variants={fadeInUp}>
              {cmsLoading ? (
                <Skeleton variant="text" width="300px" height="48px" className="mx-auto" />
              ) : (
                <CalligraphicText 
                  text={getTxt('title', 'story.title')} 
                  fontSize="3.5rem"
                  duration={2}
                />
              )}
            </motion.div>
          </div>
          
          {/* The couple, side by side on every screen (no scrolling between them) */}
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-[1fr_auto_1fr] items-start justify-items-center gap-2 sm:gap-8 md:gap-16 max-w-4xl mx-auto mb-16"
          >
            <CouplePortrait
              image={getTxt('bride_image')}
              name={brideName}
              role={content?.our_story?.content?.bride_role ? getTxt('bride_role', 'story.bride_role') : null}
              alt={getTxt('bride_name', 'Bride')}
              loading={cmsLoading}
              from="left"
            />
            <div className="mt-[52px] sm:mt-[78px] md:mt-[110px]">
              <LineHeart />
            </div>
            <CouplePortrait
              image={getTxt('groom_image')}
              name={groomName}
              role={content?.our_story?.content?.groom_role ? getTxt('groom_role', 'story.groom_role') : null}
              alt={getTxt('groom_name', 'Groom')}
              loading={cmsLoading}
              from="right"
            />
          </motion.div>
          
          <motion.div 
            variants={fadeInUp}
            className="max-w-3xl mx-auto text-center"
          >
            <p 
              className="text-xl leading-relaxed mb-8"
              style={{ color: '#6B5D52', fontFamily: "'Cormorant Garamond', serif" }}
            >
              {cmsLoading ? (
                <>
                  <Skeleton variant="text" width="100%" as="span" />
                  <Skeleton variant="text" width="90%" as="span" />
                </>
              ) : getTxt('content', 'story.part1')}
            </p>
            <p 
              className="text-xl leading-relaxed mb-8"
              style={{ color: '#6B5D52', fontFamily: "'Cormorant Garamond', serif" }}
            >
              {cmsLoading ? (
                <>
                  <Skeleton variant="text" width="100%" as="span" />
                  <Skeleton variant="text" width="85%" as="span" />
                </>
              ) : getTxt('content_2', 'story.part2')}
            </p>
            <motion.p 
              className="text-4xl md:text-5xl mt-10"
              style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false }}
              transition={{ duration: 0.8 }}
            >
              {cmsLoading ? <Skeleton variant="text" width="200px" height="48px" className="mx-auto" as="span" /> : getTxt('quote', 'story.quote')}
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// Event Details with Timeline Illustration
function EventDetails({ content, loading: cmsLoading }) {
  const { t, i18n } = useTranslation();
  const getTxt = (field, fallback) => getContent(content, 'events', field, i18n, fallback, t);
  
  // Build events from CMS content or use fallbacks
  const buildEvents = () => {
    const icons = [
      <CenteredFlower size={80} />,
      <FloatingFlower type="secondary-top-left" size={80} duration={8} />,
      <FlowersCentered size={80} />
    ];
    const fallbacks = [
      { time: '2:00 PM', title: t('events.ceremony'), description: t('events.ceremony_desc'), location: 'Garden Pavilion' },
      { time: '4:00 PM', title: t('events.cocktail'), description: t('events.cocktail_desc'), location: 'Terrace' },
      { time: '5:30 PM', title: t('events.reception'), description: t('events.reception_desc'), location: 'Grand Ballroom' }
    ];
    
    return [1, 2, 3].map((num, idx) => ({
      id: num,
      time: getTxt(`event_${num}_time`, null) || fallbacks[idx].time,
      title: getTxt(`event_${num}_title`, null) || fallbacks[idx].title,
      description: getTxt(`event_${num}_description`, null) || fallbacks[idx].description,
      location: getTxt(`event_${num}_location`, null) || fallbacks[idx].location,
      map_link: getTxt(`event_${num}_map_link`, null),
      icon: icons[idx]
    }));
  };
  
  const events = buildEvents();
  
  const [polaroids, setPolaroids] = useState([]);

  useEffect(() => {
    polaroidService.getAll().then(res => {
        setPolaroids(res.data || []);
    }).catch(err => console.error(err));
  }, []);

  const getPolaroid = (index, location) => {
      if (!polaroids.length) return null;
      if (location) {
          const found = polaroids.find(p => p.location === location);
          if (found) return found;
      }
      const unassigned = polaroids.filter(p => !p.location);
      if (!unassigned.length) return null;
      return unassigned[(index + 6) % unassigned.length];
  };

  return (
    <section 
      className="section relative"
      style={{ background: 'linear-gradient(180deg, #FBF8F3 0%, #F3EBDF 100%)', zIndex: 20 }}
    >
      <div className="absolute top-8 left-24 pointer-events-none">
         {(() => {
             const p = getPolaroid(6, 'events_top_left');
             return p ? (
             <PolaroidFloatingImage 
                src={getAssetUrl(p.image_path)} 
                size={160} 
                duration={10} 
                rotate={8}
                note={p.note}
                customSize={p.custom_size}
                offsetX={p.offset_x}
                offsetY={p.offset_y}
                customRotation={p.rotation} 
             />
          ) : null;
         })()}
      </div>
      <div className="absolute bottom-8 right-24 pointer-events-none">
         {(() => {
             const p = getPolaroid(7, 'events_bottom_right');
             return p ? (
             <PolaroidFloatingImage 
                src={getAssetUrl(p.image_path)} 
                size={160} 
                duration={12} 
                delay={1} 
                rotate={-6}
                note={p.note}
                customSize={p.custom_size}
                offsetX={p.offset_x}
                offsetY={p.offset_y}
                customRotation={p.rotation} 
             />
          ) : null;
         })()}
      </div>
      
      <div className="container-wedding relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          variants={staggerContainer}
        >
          <div className="text-center mb-16">
            <FlowerDivider />
            <motion.div variants={fadeInUp}>
              {cmsLoading ? (
                <Skeleton variant="text" width="300px" height="48px" className="mx-auto" />
              ) : (
                <CalligraphicText 
                  text={getTxt('title', 'events.title')} 
                  fontSize="3.5rem"
                  duration={2}
                />
              )}
            </motion.div>
          </div>
          
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 hidden md:block">
              <motion.div
                className="w-full h-full"
                style={{ 
                  background: 'linear-gradient(180deg, #B8936C, #A67B5B, #B8936C)',
                  transformOrigin: 'top',
                }}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: false }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
            
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 mb-16 last:mb-0 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                  <motion.div
                    className="inline-block p-8 rounded-3xl"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.95)',
                      boxShadow: '0 15px 50px rgba(166, 123, 91, 0.15)',
                    }}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: '0 20px 60px rgba(166, 123, 91, 0.25)',
                    }}
                  >
                    <span 
                      className="text-2xl font-medium block mb-2"
                      style={{ color: '#A67B5B', fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {event.time}
                    </span>
                    <h3 
                      className="text-3xl mb-3"
                      style={{ fontFamily: "'Great Vibes', cursive", color: '#4A3F35' }}
                    >
                      {event.title}
                    </h3>
                    <p className="mb-3" style={{ color: '#6B5D52' }}>
                      {event.description}
                    </p>
                    <p className="text-sm flex items-center gap-2 justify-end" style={{ color: '#8B7B6B' }}>
                      {event.map_link ? (
                        <a 
                          href={event.map_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:text-[#A67B5B] transition-colors"
                        >
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </a>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </>
                      )}
                    </p>
                  </motion.div>
                </div>
                
                <motion.div
                  className="relative z-10 flex-shrink-0"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <div 
                    className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center"
                    style={{ 
                      background: 'linear-gradient(135deg, #FDFAF5 0%, #F3EBDF 100%)',
                      border: '4px solid #A67B5B',
                      boxShadow: '0 10px 30px rgba(166, 123, 91, 0.2)',
                    }}
                  >
                    {event.icon}
                  </div>
                </motion.div>
                
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Gallery with Parallax Effect
function GallerySection({ content, loading: cmsLoading }) {
  const { t, i18n } = useTranslation();
  const getTxt = (field, fallback) => getContent(content, 'gallery', field, i18n, fallback, t);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGallery = async () => {
    try {
      const res = await galleryService.getAll();
      const visibleImages = (res.data || []).filter(img => img.is_visible !== false);
      setImages(visibleImages);
    } catch (err) {
      console.error("Home gallery fetch failed", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchGallery().finally(() => setLoading(false));
  }, []);

  const displayImages = images.length > 0 ? images : [
    { image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80', span: 'col-span-2 row-span-2' },
    { image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80', span: '' },
    { image_url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=600&q=80', span: '' },
    { image_url: 'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?auto=format&fit=crop&w=600&q=80', span: '' },
    { image_url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=600&q=80', span: '' },
    { image_url: 'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?auto=format&fit=crop&w=600&q=80', span: 'col-span-2' },
  ];

  return (
    <section className="section" style={{ background: '#FFFEF8', zIndex: 10, position: 'relative' }}>
      <div className="container-wedding">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.1 }}
          variants={staggerContainer}
        >
          <div className="text-center mb-16">
            <FlowerDivider />
            <motion.div variants={fadeInUp}>
              {cmsLoading ? (
                <Skeleton variant="text" width="300px" height="48px" className="mx-auto" />
              ) : (
                <CalligraphicText 
                  text={getTxt('title', 'gallery.title')} 
                  fontSize="3.5rem"
                  duration={2}
                />
              )}
            </motion.div>
          </div>
          
          <motion.div 
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]"
          >
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                   <Skeleton variant="image" height="100%" className="w-full h-full" />
                </div>
              ))
            ) : (images.length > 0 ? images : displayImages).map((image, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                className={`relative overflow-hidden rounded-2xl group cursor-pointer ${image.span || ''}`}
                whileHover={{ scale: 1.02 }}
              >
                <ParallaxImage
                  src={getAssetUrl(image.image_url || image.src)}
                  alt=""
                  className="w-full h-full"
                  speed={0.3}
                  style={{ objectPosition: image.object_position || 'center' }}
                />
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(74, 63, 53, 0.5) 100%)' }}
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection({ content, loading: cmsLoading }) {
  const { t, i18n } = useTranslation();
  const getTxt = (field, fallback) => getContent(content, 'rsvp', field, i18n, fallback, t);

  return (
    <section 
      className="section relative"
      style={{ background: 'linear-gradient(135deg, #F3EBDF 0%, #FBF8F3 50%, #F3EBDF 100%)', zIndex: 0 }}
    >
      <div className="container-wedding relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="text-center max-w-2xl mx-auto"
        >
          <FlowerDivider />
          
          <motion.div variants={fadeInUp}>
            {cmsLoading ? (
              <Skeleton variant="text" width="300px" height="48px" className="mx-auto" />
            ) : (
              <CalligraphicText 
                text={getTxt('title', 'rsvp.title')} 
                fontSize="3.5rem"
                duration={2}
              />
            )}
          </motion.div>
          
          <motion.p
            variants={fadeInUp}
            className="text-xl mt-6 mb-12"
            style={{ color: '#6B5D52', fontFamily: "'Cormorant Garamond', serif" }}
          >
            {cmsLoading ? <Skeleton variant="text" width="400px" className="mx-auto" as="span" /> : getTxt('description', 'rsvp.subtitle')}
          </motion.p>
          
          <motion.div 
            variants={staggerContainer}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.div variants={staggerItem}>
              <Button as={Link} to="/rsvp" variant="secondary" icon={Heart}>
                {t('rsvp.respond')}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// Main Home Page
export default function Home() {
  const { contents: content, settings, isVisible, loading: contentLoading } = useContent();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <main>
        {isVisible('home_hero') && <HeroSection content={content} settings={settings} loading={contentLoading} />}
        {isVisible('countdown') && <CountdownSection content={content} settings={settings} loading={contentLoading} />}
        {isVisible('our_story') && <StorySection content={content} settings={settings} loading={contentLoading} />}
        {isVisible('events') && <EventDetails content={content} loading={contentLoading} />}
        {isVisible('gallery') && <GallerySection content={content} loading={contentLoading} />}
        {isVisible('rsvp') && <CTASection content={content} loading={contentLoading} />}
      </main>
    </motion.div>
  );
}
