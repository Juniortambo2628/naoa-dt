/**
 * The bride's thank-you visual: the patterned map of Africa with the thank
 * you set inside it. Text scales with the map's width (container units), so
 * it reads the same as a small card on a phone or large in the hero.
 */
export default function AfricaThankYou({ dateText = '', message = '', className = '', headingLevel = 'h2' }) {
  const Heading = headingLevel;
  return (
    <div className={`relative w-full aspect-[531/571] [container-type:inline-size] ${className}`}>
      <img
        src="/illustrations/africa-map.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.25)]"
      />
      <div className="absolute left-[19%] right-[27%] top-[18.5%] flex flex-col items-center text-center text-[#FBF3EA]">
        {dateText && (
          <p className="tracking-[0.25em] border-b border-[#FBF3EA]/70 pb-[1cqw] mb-[2cqw] text-[#FBF3EA]!" style={{ fontSize: '3.2cqw', fontFamily: "'Cormorant Garamond', serif" }}>
            {dateText}
          </p>
        )}
        <Heading className="leading-[0.95]! text-[#FBF3EA]!" style={{ fontFamily: "'Great Vibes', cursive", fontSize: '11.5cqw', fontWeight: 400 }}>
          Thank you
        </Heading>
      </div>
      {/* Below the bulge of West Africa the land narrows, so the words sit to the east. */}
      {message && (
        <p className="absolute left-[37%] right-[18%] top-[41%] text-center leading-snug text-[#FBF3EA]!" style={{ fontSize: '2.9cqw', fontFamily: "'Lato', system-ui, sans-serif" }}>
          {message}
        </p>
      )}
    </div>
  );
}
