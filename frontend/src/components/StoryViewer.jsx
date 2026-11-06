import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { MapPin, X } from 'lucide-react';
import { polaroidService } from '../services/api';
import { getAssetUrl } from '../utils/assetUrl';
import { markSeen, optimisticReaction, REACTIONS, STORY_DURATION_MS } from '../utils/stories';
import { buttonClass } from './buttonStyles';

/**
 * StoryViewer — a Snapchat-style player for the polaroid feed.
 *
 * Segmented progress bars, auto-advance with hold-to-pause, tap left/right to
 * move, Esc/swipe-down to close — and an emoji reaction bar that updates
 * instantly (the server response replaces the optimistic state a beat later).
 */
export default function StoryViewer({ stories, initialIndex = 0, guestCode, guestName, onClose }) {
  const [storyIndex, setStoryIndex] = useState(initialIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reactions, setReactions] = useState({}); // { [itemId]: summary }
  // -1 = no press started, so a click from a keyboard or screen reader still
  // counts as a tap rather than being mistaken for a hold-to-pause.
  const holdStartRef = useRef(-1);
  const touchStartRef = useRef(null);

  const list = useMemo(() => (stories || []).filter((s) => s.items?.length), [stories]);
  const story = list[storyIndex];
  const items = useMemo(() => story?.items || [], [story]);
  const item = items[itemIndex];

  /** Step forward; at the end of a story move to the next one, then close. */
  const go = (delta) => {
    if (!story) return;
    if (delta > 0) {
      if (itemIndex < items.length - 1) {
        setItemIndex((i) => i + 1);
      } else if (storyIndex < list.length - 1) {
        setStoryIndex((s) => s + 1);
        setItemIndex(0);
      } else {
        onClose?.();
      }
      return;
    }
    if (itemIndex > 0) {
      setItemIndex((i) => i - 1);
    } else if (storyIndex > 0) {
      // Stepping back into another author's story lands on their newest photo.
      const previous = list[storyIndex - 1];
      setStoryIndex(storyIndex - 1);
      setItemIndex(Math.max(0, (previous?.items?.length || 1) - 1));
    }
  };

  // Remember what has been watched, and preload the next photo.
  useEffect(() => {
    if (item) markSeen([item.id]);
    const next = items[itemIndex + 1] || list[storyIndex + 1]?.items?.[0];
    if (next?.image) {
      const preload = new Image();
      preload.src = getAssetUrl(next.image);
    }
  }, [item, items, itemIndex, list, storyIndex]);

  // Keyboard: ←/→ navigate, Space pauses, Esc closes.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
      else if (event.key === 'Escape') onClose?.();
      else if (event.key === ' ') {
        event.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const summaryFor = (photo) => reactions[photo.id] ?? photo.reactions ?? { count: 0, by_emoji: {}, mine: null };

  const react = async (emoji) => {
    if (!item) return;
    const current = summaryFor(item);
    const removing = current.mine === emoji;
    const optimistic = optimisticReaction(current, emoji, removing);

    setReactions((prev) => ({ ...prev, [item.id]: optimistic }));

    try {
      const payload = {
        emoji,
        ...(guestCode ? { guest_code: guestCode } : {}),
        ...(guestName ? { guest_name: guestName } : {}),
      };
      const response = removing
        ? await polaroidService.removeReaction(item.id, { ...(guestCode ? { guest_code: guestCode } : {}), ...(guestName ? { guest_name: guestName } : {}) })
        : await polaroidService.addReaction(item.id, payload);
      setReactions((prev) => ({ ...prev, [item.id]: response.data }));
    } catch {
      setReactions((prev) => ({ ...prev, [item.id]: current })); // roll back
    }
  };

  const onPressDown = () => {
    holdStartRef.current = Date.now();
    setPaused(true);
  };
  const onPressUp = () => setPaused(false);
  const wasHold = () => holdStartRef.current > 0 && Date.now() - holdStartRef.current > 260;

  const onTouchStart = (event) => {
    touchStartRef.current = event.touches?.[0]?.clientY ?? null;
  };
  const onTouchEnd = (event) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (start == null) return;
    const delta = (event.changedTouches?.[0]?.clientY ?? start) - start;
    if (delta > 80) onClose?.();
  };

  if (!story || !item) return null;

  const summary = summaryFor(item);
  const takenAt = item.taken_at
    ? new Date(item.taken_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  const shell = (
    <div
      className="fixed inset-0 z-[10002] bg-black text-white flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Story from ${story.author}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style>{`@keyframes story-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>

      {/* Progress segments — one per photo in this author's story */}
      <div className="flex gap-1 px-3 pt-3">
        {items.map((photo, index) => (
          <div key={photo.id} className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden">
            {index < itemIndex && <div className="h-full w-full bg-white" />}
            {index === itemIndex && (
              <div
                className="h-full w-full bg-white origin-left"
                style={{
                  animationName: 'story-progress',
                  animationDuration: `${STORY_DURATION_MS}ms`,
                  animationTimingFunction: 'linear',
                  animationFillMode: 'forwards',
                  animationPlayState: paused ? 'paused' : 'running',
                }}
                onAnimationEnd={() => !paused && go(1)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-full bg-[#A67B5B] flex items-center justify-center text-sm font-semibold shrink-0">
            {story.author.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{story.author}</p>
            <p className="text-[11px] text-white/50 truncate">
              {takenAt} · {itemIndex + 1} of {items.length}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close stories"
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Photo + tap zones */}
      <div
        className="relative flex-1 min-h-0 select-none"
        onPointerDown={onPressDown}
        onPointerUp={onPressUp}
        onPointerLeave={onPressUp}
      >
        <motion.img
          key={item.id}
          initial={{ opacity: 0.4, scale: 1.01 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          src={getAssetUrl(item.image)}
          alt={item.caption || `Photo by ${story.author}`}
          className="absolute inset-0 w-full h-full object-contain"
        />

        {paused && (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-full bg-black/60 text-sm">
            Paused
          </span>
        )}

        <button
          type="button"
          onClick={() => !wasHold() && go(-1)}
          aria-label="Previous photo"
          className="absolute inset-y-0 left-0 w-1/3 focus:outline-none focus:ring-2 focus:ring-white/40"
        />
        <button
          type="button"
          onClick={() => !wasHold() && go(1)}
          aria-label="Next photo"
          className="absolute inset-y-0 right-0 w-2/3 focus:outline-none focus:ring-2 focus:ring-white/40"
        />
      </div>

      {/* Caption + reactions */}
      <div className="px-4 pb-6 pt-3 bg-gradient-to-t from-black/85 to-transparent">
        {(item.caption || item.location) && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {item.caption && <p className="text-sm text-white/90">{item.caption}</p>}
            {item.location && (
              <span className="inline-flex items-center gap-1 text-[11px] text-white/50">
                <MapPin className="w-3 h-3" /> {item.location}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {REACTIONS.map((emoji) => {
            const count = summary.by_emoji?.[emoji] || 0;
            const active = summary.mine === emoji;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => react(emoji)}
                aria-label={`React ${emoji}${active ? ' (yours)' : ''}`}
                aria-pressed={active}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm transition ${
                  active
                    ? buttonClass({ variant: 'secondary', size: 'sm', className: 'rounded-full gap-1' })
                    : count > 0
                      ? 'bg-white/20 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <span aria-hidden="true">{emoji}</span>
                {count > 0 && <span className="text-xs font-medium tabular-nums">{count}</span>}
              </button>
            );
          })}
          {summary.count > 0 && (
            <span className="ml-auto text-[11px] text-white/50">
              {summary.count} reaction{summary.count === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(shell, document.body);
}
