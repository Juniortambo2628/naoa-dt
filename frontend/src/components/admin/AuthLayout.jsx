import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CalendarHeart, Eye, EyeOff, Loader2, Users, Armchair, Palette, Images, Mail } from 'lucide-react';
import { useContent } from '../../context/ContentContext';

/**
 * Shared layout of the admin's sign-in pages (login, 2FA, accept invite):
 * a light card with the form on the left and a dark showcase of the planner
 * on the right (desktop only — phones get the form alone, full width).
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page min-h-dvh flex items-center justify-center p-3 sm:p-6 lg:p-10 bg-[#F3EDE7]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-6xl grid lg:grid-cols-2 gap-3 p-3 rounded-[2rem] bg-[#FBF8F5] border border-white shadow-[0_30px_80px_-30px_rgba(74,63,53,0.35)]"
      >
        <section className="flex flex-col px-5 py-8 sm:px-10 lg:px-14 lg:py-12">
          <a href="/" className="flex items-center gap-2.5 self-start" aria-label="Back to the wedding website">
            <img src="/Naoa-logo.png" alt="" className="h-9 w-auto" />
            <span className="leading-none">
              <span className="block text-sm font-semibold text-[#4A3F35]">naoa.</span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-[#A68B76]">wedding planner</span>
            </span>
          </a>

          <div className="flex-1 flex flex-col justify-center w-full max-w-sm mx-auto lg:mx-0 py-10">
            <h1 className="!text-3xl !font-semibold tracking-tight !text-[#2B221C]">{title}</h1>
            {subtitle && <div className="mt-2 text-sm leading-relaxed text-[#8B7B6B]">{subtitle}</div>}
            <div className="mt-8">{children}</div>
          </div>

          {footer && <div className="w-full max-w-sm mx-auto lg:mx-0 text-sm text-[#8B7B6B]">{footer}</div>}
        </section>

        <Showcase />
      </motion.div>
    </div>
  );
}

const FEATURES = [
  { icon: Users, label: 'Guests' },
  { icon: Mail, label: 'Invitations' },
  { icon: Armchair, label: 'Seating' },
  { icon: Palette, label: 'Design' },
  { icon: Images, label: 'Gallery' },
];

/** The dark right-hand panel: a stylised glimpse of the planner, with this wedding's details. */
function Showcase() {
  const { weddingInfo } = useContent() || {};
  const date = weddingInfo?.wedding_date ? new Date(weddingInfo.wedding_date) : null;
  const validDate = date && !Number.isNaN(date.getTime());
  const days = validDate ? Math.max(0, Math.ceil((date - new Date()) / 86400000)) : null;
  const names = weddingInfo?.couple_names || 'Your wedding';

  return (
    <aside
      aria-hidden="true"
      className="hidden lg:flex flex-col relative overflow-hidden rounded-[1.6rem] min-h-[640px] px-10 pt-14 pb-8 text-white bg-[#17110D]"
    >
      {/* Copper glow at the top, like light on the card */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[46rem] h-[30rem] rounded-full bg-[radial-gradient(closest-side,rgba(196,120,70,0.55),rgba(120,64,34,0.25)_55%,transparent)]" />

      <div className="relative text-center">
        <div className="text-xl font-light text-white/80">Plan together.</div>
        <div className="text-4xl font-semibold tracking-tight mt-1">Beautifully. Calmly.</div>
      </div>

      {/* Phone-style card with the wedding at a glance */}
      <div className="relative flex-1 flex items-center justify-center mt-10">
        <div className="relative w-64 rounded-[2.2rem] border border-white/10 bg-gradient-to-b from-[#3A2A20] to-[#15100C] p-5 shadow-2xl">
          <div className="flex justify-between text-[10px] text-white/60"><span>9:41</span><span>● ● ●</span></div>
          <div className="mt-5 text-[11px] text-white/50">Counting down to</div>
          <div className="text-lg font-semibold leading-tight">{names}</div>
          {validDate && (
            <div className="text-[11px] text-white/60 mt-0.5">
              {date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
          <div className="mt-4 rounded-2xl bg-white/[0.06] border border-white/10 p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/50">RSVPs</div>
            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#8B5E3C] to-[#E09A6A]" />
            </div>
            <div className="mt-3 flex items-end gap-1.5 h-14">
              {[40, 55, 35, 70, 90, 60, 80].map((h, i) => (
                <span key={i} className="flex-1 rounded-t bg-gradient-to-t from-[#5A3A26] to-[#D08A5E]" style={{ height: `${h}%`, opacity: 0.55 + i * 0.06 }} />
              ))}
            </div>
          </div>
        </div>

        {/* Floating pill, like a card peeking out of the phone */}
        <div className="absolute left-2 xl:left-6 top-[64%] flex items-center gap-3 rounded-2xl border border-white/10 bg-[#2A1F18]/90 backdrop-blur px-3.5 py-2.5 shadow-xl">
          <span className="w-8 h-8 rounded-full bg-[#A67B5B]/30 flex items-center justify-center"><CalendarHeart className="w-4 h-4 text-[#E8C2A4]" /></span>
          <span className="leading-tight">
            <span className="block text-[11px] font-medium">{days != null ? `${days} days to go` : 'Save the date'}</span>
            <span className="block text-[10px] text-white/50">Everything in one place</span>
          </span>
        </div>
      </div>

      <ul className="relative mt-10 flex justify-between text-[11px] text-white/40">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return <li key={feature.label} className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" />{feature.label}</li>;
        })}
      </ul>
    </aside>
  );
}

const fieldClass = 'w-full h-12 px-5 rounded-full bg-white border border-[#EDE4DC] text-sm text-[#2B221C] placeholder:text-[#B8A898] shadow-[0_1px_2px_rgba(74,63,53,0.04)] outline-none transition focus:border-[#C49274] focus:ring-4 focus:ring-[#C49274]/15 read-only:bg-[#F6F1EC] read-only:text-[#8B7B6B]';

/** A labelled pill input; `type="password"` gets a show/hide toggle. */
export function AuthField({ id, label, type = 'text', error, className = '', inputClassName = '', ...props }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-semibold text-[#4A3F35] mb-2">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${fieldClass} ${isPassword ? 'pr-12' : ''} ${error ? '!border-red-300' : ''} ${inputClassName}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[#A68B76] hover:text-[#4A3F35] hover:bg-[#F6F1EC]"
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <div id={`${id}-error`} className="mt-1.5 pl-5 text-xs text-red-600">{error}</div>}
    </div>
  );
}

/** The copper gradient pill button of the sign-in pages. */
export function AuthSubmit({ loading, children, ...props }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full h-12 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#7A5236] via-[#A06A47] to-[#D08A5E] shadow-[0_10px_24px_-10px_rgba(160,106,71,0.8)] transition hover:brightness-105 active:brightness-95 disabled:opacity-70 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C49274]/30"
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function AuthError({ children }) {
  if (!children) return null;
  return (
    <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
