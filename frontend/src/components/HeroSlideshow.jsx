import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getAssetUrl } from '../services/api';

/**
 * Full-bleed background slideshow of wedding photos: each one fades in with
 * a slow drift, then the next. Content goes on top as children; a warm
 * gradient keeps it readable on any photo. A few photos get dots; a long
 * run (the couple's favourites can be a hundred) gets a counter and arrows.
 */
const MAX_DOTS = 12;

export default function HeroSlideshow({ photos = [], interval = 6000, className = '', children }) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const count = photos.length;

  useEffect(() => {
    if (count < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(id);
  }, [count, interval]);

  // Warm up the next photo so the change never shows a blank frame.
  useEffect(() => {
    if (count < 2) return;
    const next = new Image();
    next.src = getAssetUrl(photos[(index + 1) % count].image_url);
  }, [index, count, photos]);

  const photo = photos[index % Math.max(count, 1)];
  const step = (by) => setIndex((i) => (i + by + count) % count);

  return (
    <div className={`relative overflow-hidden bg-[#2E2722] ${className}`}>
      <AnimatePresence initial={false}>
        {photo && (
          <motion.img
            key={photo.id ?? index}
            src={getAssetUrl(photo.image_url)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: photo.object_position || 'center' }}
            initial={{ opacity: 0, scale: reduce ? 1 : 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.4 }, scale: { duration: interval / 1000 + 1.4, ease: 'linear' } }}
          />
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-[#1F1A16]/85 via-[#1F1A16]/35 to-[#1F1A16]/30" aria-hidden="true" />
      <div className="relative h-full">{children}</div>
      {count > MAX_DOTS && (
        <div className="absolute bottom-3 right-3 md:right-8 z-10 flex items-center gap-1 rounded-full bg-black/35 backdrop-blur-sm px-1 py-0.5 text-white">
          <button type="button" aria-label="Previous photo" onClick={() => step(-1)} className="p-1.5 rounded-full hover:bg-white/15">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs tabular-nums min-w-[4.5rem] text-center" aria-live="off">{(index % count) + 1} / {count}</span>
          <button type="button" aria-label="Next photo" onClick={() => step(1)} className="p-1.5 rounded-full hover:bg-white/15">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      {count > 1 && count <= MAX_DOTS && (
        <div className="absolute bottom-4 right-4 md:right-8 flex gap-1.5 z-10">
          {photos.map((p, i) => (
            <button
              key={p.id ?? i}
              type="button"
              aria-label={`Show photo ${i + 1} of ${count}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
