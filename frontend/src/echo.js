// Laravel Echo (live updates) is optional: smart polling is the primary
// real-time mechanism and works on shared hosting. Echo and pusher-js are only
// downloaded when broadcasting keys are configured, and only once something
// asks for them, so guests don't pay for them on first load.

const env = import.meta.env;

function echoOptions() {
  if (env.VITE_REVERB_APP_KEY) {
    const scheme = env.VITE_REVERB_SCHEME ?? 'http';
    const wsPort = Number(env.VITE_REVERB_PORT) || (scheme === 'https' ? 443 : 80);
    const forceTLS = scheme === 'https';
    return {
      broadcaster: 'reverb',
      key: env.VITE_REVERB_APP_KEY,
      wsHost: env.VITE_REVERB_HOST,
      wsPort,
      wssPort: forceTLS ? (Number(env.VITE_REVERB_PORT) || 443) : wsPort,
      forceTLS,
      enabledTransports: ['ws', 'wss'],
    };
  }
  if (env.VITE_PUSHER_APP_KEY) {
    return {
      broadcaster: 'pusher',
      key: env.VITE_PUSHER_APP_KEY,
      cluster: env.VITE_PUSHER_APP_CLUSTER ?? 'mt1',
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
    };
  }
  return null;
}

export const realtimeEnabled = !!echoOptions();

let echoPromise = null;

/** Resolves to the shared Echo instance, or null when live updates are off or fail to load. */
export function getEcho() {
  const options = echoOptions();
  if (!options) return Promise.resolve(null);
  echoPromise ??= Promise.all([import('laravel-echo'), import('pusher-js')])
    .then(([{ default: Echo }, { default: Pusher }]) => {
      window.Pusher = Pusher;
      window.Echo = new Echo(options);
      return window.Echo;
    })
    .catch(() => null);
  return echoPromise;
}
