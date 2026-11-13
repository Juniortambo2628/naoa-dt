/**
 * Scan feedback the usher can feel and hear: a buzz (Android; iPhones don't
 * let websites vibrate) and a soft tone (any phone, once the page has been
 * tapped). Both fail quietly where unsupported.
 */
export const PATTERNS = {
  found: [40],
  success: [60, 50, 120],
  warning: [120, 80, 120],
  error: [250],
};

const TONES = {
  found: [[880, 0.08]],
  success: [[660, 0.09], [990, 0.14]],
  warning: [[520, 0.12], [520, 0.12]],
  error: [[220, 0.25]],
};

export function vibrate(kind, nav = typeof navigator !== 'undefined' ? navigator : undefined) {
  try {
    if (nav && typeof nav.vibrate === 'function') return nav.vibrate(PATTERNS[kind] || PATTERNS.found);
  } catch { /* not allowed */ }
  return false;
}

let audio = null;
function context() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audio) audio = new Ctx();
  if (audio.state === 'suspended') audio.resume().catch(() => {});
  return audio;
}

/** Wake the sound up on a tap, so later scans can make a tone (iPhone). */
export function unlockSound() {
  try { context(); } catch { /* no audio */ }
}

export function tone(kind) {
  try {
    const ctx = context();
    if (!ctx || ctx.state !== 'running') return;
    let at = ctx.currentTime;
    for (const [freq, length] of TONES[kind] || TONES.found) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.18, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + length + 0.02);
      at += length + 0.04;
    }
  } catch { /* no audio */ }
}

export function feedback(kind) {
  vibrate(kind);
  tone(kind);
}
