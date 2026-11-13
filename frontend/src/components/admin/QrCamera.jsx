import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, SwitchCamera, Pause, Play } from 'lucide-react';

import { cameraErrorMessage } from '../../utils/cameraErrors';
import './qr-camera.css';

const ELEMENT_ID = 'checkin-camera';

/**
 * The check-in camera. Opens the back camera as soon as the page loads (the
 * browser asks for permission the first time) and reads one QR after another.
 * `paused` holds the camera on a result while the parent shows it.
 */
export default function QrCamera({ onScan, paused = false }) {
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const [status, setStatus] = useState('starting'); // starting | live | stopped | error
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [cameraIndex, setCameraIndex] = useState(-1); // -1: the back camera by facing mode

  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try { if (scanner.isScanning) await scanner.stop(); } catch { /* already stopped */ }
    try { scanner.clear(); } catch { /* nothing to clear */ }
    scannerRef.current = null;
  }, []);

  const start = useCallback(async (index = cameraIndex) => {
    await stop();
    setError(null);
    setStatus('starting');
    const scanner = new Html5Qrcode(ELEMENT_ID, {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    });
    scannerRef.current = scanner;
    const source = index >= 0 && cameras[index] ? cameras[index].id : { facingMode: 'environment' };
    try {
      await scanner.start(
        source,
        {
          fps: 12,
          // A square in the middle of the picture; the frame drawn on top matches it.
          qrbox: (w, h) => {
            const side = Math.floor(Math.min(w, h) * 0.7);
            return { width: side, height: side };
          },
          aspectRatio: 1,
          disableFlip: true,
        },
        (text) => onScanRef.current?.(text),
        () => {},
      );
      setStatus('live');
      // Knowing the cameras needs permission, so ask once it is granted.
      if (!cameras.length) Html5Qrcode.getCameras().then(setCameras).catch(() => {});
    } catch (err) {
      scannerRef.current = null;
      setError(cameraErrorMessage(err));
      setStatus('error');
    }
  }, [cameraIndex, cameras, stop]);

  // Open the camera straight away, and let it go when the page closes.
  useEffect(() => {
    start(-1);
    return () => { stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hold the picture while a result is on screen.
  useEffect(() => {
    const scanner = scannerRef.current;
    if (!scanner || status !== 'live') return;
    try {
      if (paused) scanner.pause(true);
      else scanner.resume();
    } catch { /* not running */ }
  }, [paused, status]);

  const switchCamera = () => {
    if (cameras.length < 2) return;
    const next = (cameraIndex + 1) % cameras.length;
    setCameraIndex(next);
    start(next);
  };

  const turnOff = async () => { await stop(); setStatus('stopped'); };

  return (
    <div>
      <div className="checkin-camera relative mx-auto w-full max-w-sm aspect-square overflow-hidden rounded-3xl bg-[#2E2722] shadow-inner">
        <div id={ELEMENT_ID} className="absolute inset-0" />

        {/* Viewfinder: soft corners over the scanning square */}
        {status === 'live' && (
          <div className="pointer-events-none absolute inset-[15%]" aria-hidden="true">
            {['top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl', 'top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl', 'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl', 'bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl'].map((c) => (
              <span key={c} className={`absolute w-10 h-10 border-[#E8D5B7] ${c}`} />
            ))}
            {!paused && <span className="checkin-scanline absolute left-3 right-3 h-0.5 rounded-full bg-[#E8D5B7]/80" />}
          </div>
        )}

        {status === 'live' && (
          <p className="pointer-events-none absolute top-3 inset-x-0 text-center text-xs tracking-wide text-[#F5EFE6]! drop-shadow">
            {paused ? 'Got it' : 'Point at the guest’s QR code'}
          </p>
        )}

        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#F5EFE6]">
            <Camera className="w-10 h-10 animate-pulse" />
            <p className="text-sm text-[#F5EFE6]!">Opening the camera…</p>
          </div>
        )}

        {status === 'stopped' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-[#F5EFE6]">
            <CameraOff className="w-10 h-10 opacity-80" />
            <button type="button" onClick={() => start()} className="inline-flex items-center gap-2 rounded-full bg-[#F5EFE6] px-5 py-2.5 text-sm font-medium text-[#4A3F35]">
              <Play className="w-4 h-4" /> Turn the camera on
            </button>
          </div>
        )}

        {status === 'error' && error && (
          <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-[#F5EFE6]">
            <CameraOff className="w-10 h-10 opacity-80" />
            <p className="font-medium text-[#F5EFE6]!">{error.title}</p>
            <p className="text-xs leading-relaxed text-[#F5EFE6]/80!">{error.help}</p>
            <button type="button" onClick={() => start()} className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#F5EFE6] px-5 py-2.5 text-sm font-medium text-[#4A3F35]">
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
          </div>
        )}
      </div>

      {status === 'live' && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {cameras.length > 1 && (
            <button type="button" onClick={switchCamera} className="inline-flex items-center gap-1.5 rounded-full border border-[#E4D6C2] bg-white px-4 py-2 text-sm text-stone-700">
              <SwitchCamera className="w-4 h-4" /> Switch camera
            </button>
          )}
          <button type="button" onClick={turnOff} className="inline-flex items-center gap-1.5 rounded-full border border-[#E4D6C2] bg-white px-4 py-2 text-sm text-stone-700">
            <Pause className="w-4 h-4" /> Turn off
          </button>
        </div>
      )}
    </div>
  );
}
