import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSavedGuestCode, isStandalone } from '../utils/guestSession';

const LAUNCH_KEY = 'guestLaunchHandled';

/**
 * When the site is opened as a home-screen web app and the guest's
 * invitation code is remembered, launch straight into their invitation
 * instead of the landing page. Only on the first screen of each launch, so
 * guests can still browse back to the homepage.
 */
export default function GuestSessionRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isStandalone()) return;
    try {
      if (sessionStorage.getItem(LAUNCH_KEY)) return;
      sessionStorage.setItem(LAUNCH_KEY, '1');
    } catch {
      return;
    }
    const code = getSavedGuestCode();
    if (code && location.pathname === '/') {
      navigate(`/invitation/${encodeURIComponent(code)}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- launch-time only
  }, []);

  return null;
}
