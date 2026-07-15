import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

// Reverb takes priority (our broadcasting driver)
if (import.meta.env.VITE_REVERB_APP_KEY) {
    const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'http';
    const wsPort = Number(import.meta.env.VITE_REVERB_PORT) || (scheme === 'https' ? 443 : 80);
    const forceTLS = scheme === 'https';

    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: wsPort,
        wssPort: forceTLS ? (Number(import.meta.env.VITE_REVERB_PORT) || 443) : wsPort,
        forceTLS,
        enabledTransports: ['ws', 'wss'],
    });
} else if (import.meta.env.VITE_PUSHER_APP_KEY) {
    window.Echo = new Echo({
        broadcaster: 'pusher',
        key: import.meta.env.VITE_PUSHER_APP_KEY,
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1',
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
    });
} else {
    console.warn('Real-time updates disabled: Pusher/Reverb keys are not defined.');
}
