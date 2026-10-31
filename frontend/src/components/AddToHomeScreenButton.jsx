import { useEffect, useState } from 'react';
import { Smartphone, Share, PlusSquare, MoreVertical, Check } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import { isStandalone } from '../utils/guestSession';
import { getInstallPrompt, onInstallPromptChange, promptInstall, isIos } from '../utils/installPrompt';

// While this button is on screen, point the web-app manifest at the guest's
// own invitation so the home-screen icon opens it directly.
function useInvitationManifest(startPath) {
  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]');
    if (!link || !startPath) return undefined;
    const original = link.getAttribute('href');
    const origin = window.location.origin;
    const manifest = {
      id: '/',
      name: document.querySelector('meta[name="application-name"]')?.content || document.title,
      short_name: document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content || document.title,
      start_url: `${origin}${startPath}`,
      scope: `${origin}/`,
      display: 'standalone',
      background_color: '#FBF7F2',
      theme_color: '#A67B5B',
      icons: [
        { src: `${origin}/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: `${origin}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    };
    link.setAttribute('href', `data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}`);
    return () => link.setAttribute('href', original);
  }, [startPath]);
}

/**
 * Prominent "Add to home screen" button for the digital invitation: installs
 * the site as a home-screen app that opens straight to the guest's invite
 * (and remembers their code). Uses the browser's install prompt where there
 * is one (Android / Chrome / Edge); elsewhere (iPhone Safari) it shows the
 * two-step instructions. Hidden when already running as the installed app.
 */
export default function AddToHomeScreenButton({ startPath, className = '' }) {
  const [canPrompt, setCanPrompt] = useState(() => !!getInstallPrompt());
  const [helpOpen, setHelpOpen] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => onInstallPromptChange((p) => setCanPrompt(!!p)), []);
  useInvitationManifest(startPath);

  if (isStandalone()) return null;

  const handleClick = async () => {
    if (canPrompt) {
      const accepted = await promptInstall();
      if (accepted) setInstalled(true);
      return;
    }
    setHelpOpen(true);
  };

  const ios = isIos();

  return (
    <>
      <div className={`bg-gradient-to-br from-palette-cinnamon/10 to-palette-light-brown/20 p-5 rounded-2xl border border-palette-cinnamon/20 ${className}`}>
        <div className="flex items-start gap-3 mb-4">
          <span className="w-10 h-10 flex-shrink-0 rounded-xl bg-white text-palette-cinnamon flex items-center justify-center shadow-sm">
            <Smartphone className="w-5 h-5" aria-hidden="true" />
          </span>
          <div className="text-left">
            <h3 className="font-semibold text-stone-800">Keep your invite one tap away</h3>
            <p className="text-sm text-stone-500">Add it to your home screen — it opens straight to your invitation, no code needed.</p>
          </div>
        </div>
        <Button variant="secondary" size="lg" fullWidth icon={installed ? Check : PlusSquare} onClick={handleClick} disabled={installed}>
          {installed ? 'Added to your home screen' : 'Add to Home Screen'}
        </Button>
      </div>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" label="Add to home screen">
        <div className="bg-white p-6 rounded-2xl">
          <p className="text-xl font-serif text-stone-800 mb-4">Add to your home screen</p>
          <ol className="space-y-4 text-stone-600">
            {ios ? (
              <>
                <li className="flex items-center gap-3">
                  <span className="w-9 h-9 flex-shrink-0 rounded-xl bg-palette-cinnamon/10 text-palette-cinnamon flex items-center justify-center"><Share className="w-5 h-5" aria-hidden="true" /></span>
                  <span>Tap the <strong>Share</strong> button in Safari’s toolbar.</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-9 h-9 flex-shrink-0 rounded-xl bg-palette-cinnamon/10 text-palette-cinnamon flex items-center justify-center"><PlusSquare className="w-5 h-5" aria-hidden="true" /></span>
                  <span>Scroll down and choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-center gap-3">
                  <span className="w-9 h-9 flex-shrink-0 rounded-xl bg-palette-cinnamon/10 text-palette-cinnamon flex items-center justify-center"><MoreVertical className="w-5 h-5" aria-hidden="true" /></span>
                  <span>Open your browser’s <strong>menu</strong>.</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-9 h-9 flex-shrink-0 rounded-xl bg-palette-cinnamon/10 text-palette-cinnamon flex items-center justify-center"><PlusSquare className="w-5 h-5" aria-hidden="true" /></span>
                  <span>Choose <strong>Add to Home screen</strong> or <strong>Install app</strong>.</span>
                </li>
              </>
            )}
          </ol>
          <Button className="mt-6" fullWidth onClick={() => setHelpOpen(false)}>Got it</Button>
        </div>
      </Modal>
    </>
  );
}
