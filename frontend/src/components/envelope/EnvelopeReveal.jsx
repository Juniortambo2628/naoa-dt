import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/** Whether this device can and should show the 3D envelope. */
function canShowEnvelope() {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * The invitation's opening: a 3D envelope pinned to the screen while the
 * guest scrolls. Scrolling down breaks the seal, opens the flap and lifts the
 * card out; scrolling back up closes it again. Three.js is only downloaded
 * when this runs, and devices without WebGL (or with reduced motion on) get
 * the normal page instead.
 */
export default function EnvelopeReveal({ guestName, coupleNames, initials, dateText, venue }) {
  const [supported] = useState(canShowEnvelope);
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const sceneRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Build the scene (and fetch three) once the fonts the card uses are in.
  useEffect(() => {
    if (!supported || !stageRef.current) return undefined;
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([
          document.fonts?.load('80px "Great Vibes"'),
          document.fonts?.load('40px "Cormorant Garamond"'),
        ].filter(Boolean)).catch(() => {});
        const { createEnvelopeScene } = await import('./envelopeScene');
        if (cancelled || !stageRef.current) return;
        sceneRef.current = createEnvelopeScene(stageRef.current, {
          greeting: guestName ? `Dear ${guestName},` : 'You are invited',
          couple: coupleNames,
          initials,
          when: dateText,
          where: venue,
        });
        setReady(true);
      } catch (err) {
        console.error('Envelope animation unavailable', err);
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [supported, guestName, coupleNames, initials, dateText, venue]);

  // Scroll drives the animation; pause rendering when off screen.
  useEffect(() => {
    if (!supported) return undefined;
    const section = sectionRef.current;
    const update = () => {
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const p = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
      sceneRef.current?.setProgress(p);
      setProgress(p);
    };
    const onPointer = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      sceneRef.current?.setPointer(x, y);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) sceneRef.current?.resume();
      else sceneRef.current?.pause();
    });
    io.observe(section);
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('pointermove', onPointer, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('pointermove', onPointer);
    };
  }, [supported, ready]);

  if (!supported || failed) return null;

  const skip = () => {
    const section = sectionRef.current;
    if (!section) return;
    const end = section.getBoundingClientRect().bottom + window.scrollY - window.innerHeight * 0.15;
    window.scrollTo({ top: end, behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="relative h-[260svh]" aria-label="Your invitation envelope">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div ref={stageRef} className="absolute inset-0" />

        {/* Hint: fades out as the envelope opens */}
        <div
          className="absolute inset-x-0 bottom-28 flex flex-col items-center gap-1 text-center pointer-events-none transition-opacity duration-300"
          style={{ opacity: ready ? Math.max(0, 1 - progress * 6) : 0 }}
        >
          <p className="font-serif text-xl text-stone-700">Scroll to open your invitation</p>
          <ChevronDown className="w-6 h-6 text-[#BF560F] animate-bounce" />
        </div>

        {/* After the card is out: nudge on to the details */}
        <div
          className="absolute inset-x-0 bottom-28 flex flex-col items-center gap-1 text-center pointer-events-none transition-opacity duration-300"
          style={{ opacity: progress > 0.9 ? 1 : 0 }}
        >
          <p className="font-serif text-lg text-stone-700">Keep scrolling for the details</p>
          <ChevronDown className="w-5 h-5 text-[#BF560F] animate-bounce" />
        </div>

        {progress < 0.9 && (
          <button
            type="button"
            onClick={skip}
            className="absolute top-6 right-4 px-4 py-2 rounded-full bg-white/70 backdrop-blur-md border border-white/80 text-sm font-medium text-stone-700 shadow-sm"
          >
            Skip
          </button>
        )}
      </div>
    </section>
  );
}
