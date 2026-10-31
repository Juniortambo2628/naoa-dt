import { useMemo } from 'react';
import { Info, UserX, Baby, Gift, Shirt } from 'lucide-react';
import { visibleGuestNotices } from '../utils/guestNotices';

// Icon per default notice (custom notices fall back to Info).
const NOTICE_ICONS = {
  invite: UserX,
  kids: Baby,
  gifts: Gift,
  dress: Shirt,
};

/**
 * Informational guest notices (plus-ones, kids, gifts, dress code…). Content
 * comes from the public `guest_notices` setting, edited in Admin → Settings →
 * Guest Notices; renders nothing when every notice is switched off.
 *
 * Rendered in the page flow (not floating) so it stays readable and never
 * collides with the floating quick-actions button:
 * - "hero": centred pills in the landing-page hero, in place of the RSVP CTA.
 * - "card": a "Good to know" card on the digital invitation.
 * Long custom notices wrap instead of running off-screen.
 */
export default function GuestNotices({ notices, variant = 'card' }) {
  const items = useMemo(() => visibleGuestNotices(notices), [notices]);

  if (!items.length) return null;

  if (variant === 'hero') {
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-3" data-testid="guest-notices">
        <div className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-palette-cinnamon">
          <Info className="w-4 h-4" aria-hidden="true" />
          Good to know
        </div>
        <ul className="flex flex-wrap justify-center gap-2 md:gap-3">
          {items.map((notice) => {
            const Icon = NOTICE_ICONS[notice.icon] || Info;
            return (
              <li key={notice.id} className="max-w-full">
                <span className="inline-flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-palette-light-brown/60 shadow-soft text-sm md:text-base font-medium text-stone-700 text-left">
                  <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 text-palette-cinnamon" aria-hidden="true" />
                  {notice.text}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <section
      className="bg-white p-5 md:p-6 rounded-2xl border border-palette-light-brown/40 shadow-sm"
      aria-labelledby="guest-notices-title"
      data-testid="guest-notices"
    >
      <div id="guest-notices-title" className="flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-wider text-palette-cinnamon">
        <Info className="w-4 h-4" aria-hidden="true" />
        Good to know
      </div>
      <ul className="grid grid-cols-1 gap-3">
        {items.map((notice) => {
          const Icon = NOTICE_ICONS[notice.icon] || Info;
          return (
            <li key={notice.id} className="flex items-center gap-3">
              <span className="w-10 h-10 flex-shrink-0 rounded-xl bg-palette-cinnamon/10 text-palette-cinnamon flex items-center justify-center">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="text-base text-stone-700 leading-snug">{notice.text}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
