import { useEffect, useRef } from 'react';

/**
 * Poll a callback at a fixed interval.
 *
 * @param {() => void} callback - Function to invoke on each tick
 * @param {number} intervalMs - Interval in milliseconds
 * @param {object} options
 * @param {boolean} options.enabled - Whether polling is active (default: true)
 * @param {boolean} options.pauseOnHidden - Pause when document is hidden (default: true)
 */
export function usePolling(callback, intervalMs, options = {}) {
  const { enabled = true, pauseOnHidden = true } = options;
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    const tick = () => savedCallback.current();

    const shouldTick = () => {
      if (pauseOnHidden && typeof document !== 'undefined' && document.hidden) {
        return false;
      }
      return true;
    };

    const intervalId = setInterval(() => {
      if (shouldTick()) {
        tick();
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [enabled, intervalMs, pauseOnHidden]);
}

export default usePolling;
