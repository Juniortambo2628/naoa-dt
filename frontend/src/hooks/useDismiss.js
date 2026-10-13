import { useEffect } from 'react';

/**
 * Closes a popover/menu on an outside click or Escape while `open`.
 * @param {React.RefObject} ref - Element that counts as "inside"
 * @param {boolean} open
 * @param {() => void} onDismiss
 */
export default function useDismiss(ref, open, onDismiss) {
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onDismiss();
    };
    const onKeyDown = (e) => { if (e.key === 'Escape') onDismiss(); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [ref, open, onDismiss]);
}
