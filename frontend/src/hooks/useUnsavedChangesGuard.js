import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { confirmAction } from '../utils/feedback';

/**
 * Warn before leaving a page with unsaved edits: on reload/close (browser
 * prompt) and when following in-app links (styled confirm dialog).
 */
export default function useUnsavedChangesGuard(dirty, message = 'You have unsaved changes. Leave without saving?') {
  const navigate = useNavigate();

  useEffect(() => {
    if (!dirty) return undefined;

    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const onClick = async (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target.closest?.('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      if (await confirmAction({ title: 'Leave without saving?', message, confirmLabel: 'Leave', tone: 'danger' })) {
        navigate(url.pathname + url.search + url.hash);
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty, message, navigate]);
}

/**
 * Track edits against the last loaded/saved copy and guard navigation.
 *   const { dirty, markSaved } = useUnsavedChanges(form);
 *   // after loading or saving: markSaved(formValues)
 */
export function useUnsavedChanges(value) {
  const [baseline, setBaseline] = useState(null);
  const dirty = baseline !== null && JSON.stringify(value) !== JSON.stringify(baseline);
  useUnsavedChangesGuard(dirty);
  return { dirty, markSaved: setBaseline };
}
