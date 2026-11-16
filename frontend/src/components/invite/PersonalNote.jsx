import { Monogram } from '../HeritageMotifs';

/**
 * A few words from the couple to this guest (Admin → Guests → Personal
 * message). Before the wedding it reads as a note with the invitation; after,
 * as a thank-you. Nothing shows when no message was written.
 */
export default function PersonalNote({ message, coupleNames = '', after = false }) {
  const text = String(message || '').trim();
  if (!text) return null;

  return (
    <figure className="relative rounded-3xl bg-[#FBF7F1] border border-[#E4D6C2] px-6 pt-7 pb-6 shadow-sm">
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-[#FBF7F1] p-1.5 border border-[#E4D6C2]">
        <Monogram size={28} />
      </div>
      <p className="text-center text-[11px] uppercase tracking-[0.25em] text-[#9A7148]">
        {after ? 'A thank-you, just for you' : 'A note just for you'}
      </p>
      <blockquote className="mt-3 text-center text-lg leading-relaxed text-stone-700 whitespace-pre-line" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        {text}
      </blockquote>
      {coupleNames && (
        <figcaption className="mt-3 text-center text-3xl text-[#A67B5B]" style={{ fontFamily: "'Great Vibes', cursive" }}>
          {coupleNames}
        </figcaption>
      )}
    </figure>
  );
}
