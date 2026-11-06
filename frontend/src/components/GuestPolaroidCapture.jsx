import { useState } from 'react';
import { Camera } from 'lucide-react';
import { useGuestByCode } from '../hooks/useApiHooks';
import Button from './Button';
import SnapStudio from './SnapStudio';

/**
 * Guest quick action "Snap a polaroid".
 *
 * A single door into Snap Studio (live camera, burst, pick which shots to
 * share). Snap Studio posts straight into the story feed on the Programme
 * page — the Gallery keeps its own upload, so nothing overlaps here.
 */
export default function GuestPolaroidCapture({ guestCode }) {
  const { data: guest } = useGuestByCode(guestCode);
  const [studioOpen, setStudioOpen] = useState(false);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-[#A67B5B]/10 text-[#A67B5B] flex items-center justify-center mb-4">
        <Camera className="w-8 h-8" />
      </div>
      <h3 className="font-serif text-xl text-stone-800 mb-1">Snap a Polaroid</h3>
      <p className="text-stone-500 text-sm max-w-xs mb-6">
        Open the camera and shoot — once, or switch on burst for a run of shots — then choose the
        ones to share. They land in Captured Moments for everyone to watch and react to.
      </p>
      <Button variant="secondary" size="lg" icon={Camera} onClick={() => setStudioOpen(true)}>
        Open camera
      </Button>

      {studioOpen && (
        <SnapStudio
          guestCode={guestCode}
          guestName={guest?.name || 'Wedding Guest'}
          onClose={() => setStudioOpen(false)}
        />
      )}
    </div>
  );
}
