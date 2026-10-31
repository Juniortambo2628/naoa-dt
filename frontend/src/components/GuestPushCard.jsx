import { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from './Button';
import { isPushSupported, needsInstallForPush, getPushSubscription, enablePush, disablePush } from '../utils/push';

/**
 * Lets a guest turn on push notifications for this device from their
 * digital invitation, so the couple's announcements (Admin → Announcements)
 * reach them. On iPhone, push only works once the invite has been added to
 * the home screen, so it says that instead.
 */
export default function GuestPushCard({ guestCode, className = '' }) {
  const supported = isPushSupported();
  const installFirst = needsInstallForPush();
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(() => supported && Notification.permission === 'denied');

  useEffect(() => {
    if (!supported) return;
    getPushSubscription().then((sub) => {
      setSubscribed(!!sub);
      // Re-link this device to the guest (also refreshes rotated keys).
      if (sub && Notification.permission === 'granted') enablePush(guestCode).catch(() => {});
    }).catch(() => {});
  }, [supported, guestCode]);

  if (!supported && !installFirst) return null;

  const turnOn = async () => {
    setBusy(true);
    try {
      await enablePush(guestCode);
      setSubscribed(true);
      toast.success("Notifications on — we'll keep you posted.");
    } catch (err) {
      if (err.permission === 'denied') setBlocked(true);
      else if (err.permission) toast("No problem — you can turn them on any time.");
      else toast.error("Sorry, we couldn't turn on notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      await disablePush();
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  };

  let message = 'Get updates on your phone — timings, transport and anything that changes on the day.';
  if (installFirst) message = 'On iPhone, add your invite to your home screen first, then open it from there to turn on notifications.';
  else if (blocked) message = 'Notifications are blocked for this site. Allow them in your browser settings to get updates.';
  else if (subscribed) message = "Notifications are on — we'll let you know about anything important.";

  const Icon = subscribed ? BellRing : blocked ? BellOff : Bell;

  return (
    <div className={`bg-white p-5 rounded-2xl border border-palette-light-brown/40 shadow-sm ${className}`}>
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 flex-shrink-0 rounded-xl bg-palette-forest/10 text-palette-forest flex items-center justify-center">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </span>
        <div className="text-left flex-1">
          <h3 className="font-semibold text-stone-800">Wedding updates</h3>
          <p className="text-sm text-stone-500">{message}</p>
        </div>
      </div>
      {supported && !installFirst && !blocked && (
        subscribed ? (
          <Button className="mt-4" size="sm" icon={BellOff} onClick={turnOff} loading={busy}>
            Turn off notifications
          </Button>
        ) : (
          <Button className="mt-4" variant="secondary" size="lg" fullWidth icon={Bell} onClick={turnOn} loading={busy}>
            Turn on notifications
          </Button>
        )
      )}
    </div>
  );
}
