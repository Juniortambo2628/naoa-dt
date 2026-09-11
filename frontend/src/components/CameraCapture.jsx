import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RotateCcw, Check, SwitchCamera } from 'lucide-react';

export default function CameraCapture({ onCapture, onClose, aspectRatio = '1:1' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const startCamera = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setLoading(false);
    } catch (err) {
      console.error('Camera error:', err);
      setError(err.message || 'Unable to access camera');
      setLoading(false);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions based on video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    
    // Apply aspect ratio cropping
    const aspect = aspectRatio.split(':').map(Number);
    const targetAspect = aspect[0] / aspect[1];
    const videoAspect = video.videoWidth / video.videoHeight;

    let sx, sy, sw, sh;
    if (videoAspect > targetAspect) {
      // Video is wider than target
      sh = video.videoHeight;
      sw = sh * targetAspect;
      sx = (video.videoWidth - sw) / 2;
      sy = 0;
    } else {
      // Video is taller than target
      sw = video.videoWidth;
      sh = sw / targetAspect;
      sx = 0;
      sy = (video.videoHeight - sh) / 2;
    }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        setCapturedImage({
          url: URL.createObjectURL(blob),
          file,
        });
      }
    }, 'image/jpeg', 0.92);
  }, [aspectRatio]);

  const retakePhoto = useCallback(() => {
    if (capturedImage?.url) {
      URL.revokeObjectURL(capturedImage.url);
    }
    setCapturedImage(null);
  }, [capturedImage]);

  const confirmCapture = useCallback(() => {
    if (capturedImage?.file) {
      onCapture(capturedImage.file);
    }
    // Cleanup
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (capturedImage?.url) {
      URL.revokeObjectURL(capturedImage.url);
    }
  }, [capturedImage, onCapture, stream]);

  const handleClose = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (capturedImage?.url) {
      URL.revokeObjectURL(capturedImage.url);
    }
    onClose();
  }, [stream, capturedImage, onClose]);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <button
          onClick={handleClose}
          className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-white font-medium">Take Photo</h3>
        <button
          onClick={toggleCamera}
          className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
        >
          <SwitchCamera className="w-6 h-6" />
        </button>
      </div>

      {/* Camera Preview / Captured Image */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
            <Camera className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Camera Unavailable</p>
            <p className="text-sm opacity-70">{error}</p>
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              Close
            </button>
          </div>
        ) : capturedImage ? (
          <img
            src={capturedImage.url}
            alt="Captured"
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex items-center justify-center gap-8">
          {capturedImage ? (
            <>
              <button
                onClick={retakePhoto}
                className="p-4 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <RotateCcw className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={confirmCapture}
                className="p-4 bg-[#A67B5B] hover:bg-[#8B6A4E] rounded-full transition-colors"
              >
                <Check className="w-8 h-8 text-white" />
              </button>
            </>
          ) : (
            <button
              onClick={capturePhoto}
              disabled={loading || !!error}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              <div className="w-14 h-14 border-4 border-stone-300 rounded-full" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
