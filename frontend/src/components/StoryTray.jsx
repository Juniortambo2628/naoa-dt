import { useMemo } from 'react';
import { Play } from 'lucide-react';
import { getAssetUrl } from '../utils/assetUrl';
import { getSeenIds } from '../utils/stories';
import { buttonClass } from './buttonStyles';

/**
 * The story tray above the polaroid feed: one circle per author (newest
 * photo as the thumb), a gradient ring for anything unwatched, and a
 * "Watch all" shortcut into the viewer.
 *
 * `seenTick` is bumped by the parent whenever the viewer closes, so the rings
 * refresh without refetching.
 */
export default function StoryTray({ stories, onOpen, seenTick = 0 }) {
  // seenTick / stories are the invalidation signal: the viewer marks photos
  // as watched outside this component, so re-read localStorage when either
  // changes (hence they appear in the dependency array below).
  const seen = useMemo(() => {
    void seenTick;
    void stories;
    return getSeenIds();
  }, [seenTick, stories]);

  if (!stories?.length) return null;

  const unseen = stories.filter((story) => story.items?.some((item) => !seen.has(item.id)));

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Stories</span>
        <button
          type="button"
          onClick={() => onOpen(0)}
          className={buttonClass({ variant: 'secondary', size: 'sm', className: 'rounded-full' })}
        >
          <Play className="w-3.5 h-3.5" aria-hidden="true" />
          Watch all
          {unseen.length > 0 && (
            <span className="ml-0.5 min-w-4 h-4 px-1 rounded-full bg-white/25 text-[10px] flex items-center justify-center tabular-nums">
              {unseen.reduce((sum, story) => sum + story.items.filter((item) => !seen.has(item.id)).length, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1">
        {stories.map((story, index) => {
          const watched = !story.items?.some((item) => !seen.has(item.id));
          const thumb = story.items[story.items.length - 1];

          return (
            <button
              key={story.key}
              type="button"
              onClick={() => onOpen(index)}
              aria-label={`Watch ${story.author}'s story${watched ? '' : ', new photos'}`}
              className="flex flex-col items-center gap-1 w-16 shrink-0 group focus:outline-none"
            >
              <span
                className={`p-0.5 rounded-full transition ${
                  watched
                    ? 'bg-stone-300'
                    : 'bg-gradient-to-tr from-[#A67B5B] via-[#C9A184] to-[#E8CBA9]'
                }`}
              >
                <span className="block w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                  <img
                    src={getAssetUrl(thumb.image)}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </span>
              </span>
              <span className="text-[11px] text-stone-600 truncate w-16 text-center">
                {story.author}
              </span>
              {!watched && <span className="w-1.5 h-1.5 rounded-full bg-[#A67B5B]" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
