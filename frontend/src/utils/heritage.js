/** The couple's mood board colours (see components/HeritageMotifs.jsx). */
export const HERITAGE = {
  bronze: '#9A7148',
  bronzeSoft: '#B8936C',
  sand: '#E9DCC9',
  ivory: '#FBF8F3',
  ink: '#4A3F35',
};

/** First letter of a name, upper-cased ("Tze Ren" → "T"). */
export const initialOf = (name, fallback) => {
  const s = String(name || '').trim();
  return s ? s[0].toUpperCase() : fallback;
};
