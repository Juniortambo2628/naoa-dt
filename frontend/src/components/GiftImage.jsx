import { useState } from 'react';
import { Gift } from 'lucide-react';
import { getAssetUrl } from '../utils/assetUrl';

/**
 * Gift photo with a built-in placeholder, used when a gift has no image or
 * its image fails to load (e.g. an external photo link that has gone away).
 * The placeholder needs no network, so a gift card never shows a broken image.
 */
export default function GiftImage({ src, alt, className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const url = src ? getAssetUrl(src) : '';

  if (!url || failedSrc === url) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br from-[#F8E8E0] to-[#E8D5C4] text-[#A67B5B] ${className}`}
      >
        <Gift className="w-1/3 h-1/3 max-w-12 max-h-12 opacity-60" aria-hidden="true" />
      </div>
    );
  }

  return <img src={url} alt={alt} loading="lazy" onError={() => setFailedSrc(url)} className={className} />;
}
