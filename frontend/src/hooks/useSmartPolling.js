import { useEffect, useRef, useState } from 'react';

/**
 * Smart polling with adaptive intervals and new-item detection.
 *
 * @param {() => Promise<Array>} fetchFn - Must return current items array
 * @param {object} options
 * @param {number} options.fastInterval - Active polling interval (default: 5000ms)
 * @param {number} options.slowInterval - Idle polling interval (default: 30000ms)
 * @param {number} options.idleAfterMs - Time before switching to slow mode (default: 60000ms)
 * @param {string} options.idKey - Key to detect new items (default: 'id')
 * @param {(newItems: Array) => void} options.onNewItems - Callback when new items detected
 * @param {boolean} options.enabled - Start/stop polling
 */
export function useSmartPolling(fetchFn, options = {}) {
  const {
    fastInterval = 5000,
    slowInterval = 30000,
    idleAfterMs = 60000,
    idKey = 'id',
    onNewItems,
    enabled = true,
  } = options;

  const [hasNewItems, setHasNewItems] = useState(false);
  const lastIdsRef = useRef(new Set());
  const lastActivityRef = useRef(0);
  const savedCallback = useRef(fetchFn);
  const savedOnNew = useRef(onNewItems);

  useEffect(() => { savedCallback.current = fetchFn; }, [fetchFn]);
  useEffect(() => { savedOnNew.current = onNewItems; }, [onNewItems]);
  
  // Initialize activity tracker after mount
  useEffect(() => { lastActivityRef.current = Date.now(); }, []);

  // Track user activity to switch between fast/slow polling
  useEffect(() => {
    if (!enabled) return;
    const reset = () => { lastActivityRef.current = Date.now(); };
    window.addEventListener('mousemove', reset, { passive: true });
    window.addEventListener('keydown', reset, { passive: true });
    window.addEventListener('scroll', reset, { passive: true });
    window.addEventListener('touchstart', reset, { passive: true });
    return () => {
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('keydown', reset);
      window.removeEventListener('scroll', reset);
      window.removeEventListener('touchstart', reset);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const tick = async () => {
      try {
        const items = await savedCallback.current();
        if (!Array.isArray(items)) return;

        const currentIds = new Set(items.map(i => i[idKey]));

        // First run — just record IDs
        if (lastIdsRef.current.size === 0) {
          lastIdsRef.current = currentIds;
          return;
        }

        // Find new items
        const newItems = items.filter(i => !lastIdsRef.current.has(i[idKey]));
        if (newItems.length > 0) {
          setHasNewItems(true);
          savedOnNew.current?.(newItems);
          setTimeout(() => setHasNewItems(false), 3000);
        }

        lastIdsRef.current = currentIds;
      } catch {
        // Silently ignore poll errors
      }
    };

    // Initial fetch
    tick();

    const getInterval = () => {
      if (document.hidden) return slowInterval * 2; // very slow when hidden
      const idle = Date.now() - lastActivityRef.current > idleAfterMs;
      return idle ? slowInterval : fastInterval;
    };

    let timeoutId;
    const scheduleNext = () => {
      timeoutId = setTimeout(async () => {
        await tick();
        scheduleNext();
      }, getInterval());
    };

    scheduleNext();

    return () => clearTimeout(timeoutId);
  }, [enabled, fastInterval, slowInterval, idleAfterMs, idKey]);

  return { hasNewItems };
}

export default useSmartPolling;
