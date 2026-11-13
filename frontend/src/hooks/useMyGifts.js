import { useEffect, useState } from 'react';
import { giftService } from '../services/api';

/** Load this invitation's own gifts. */
export default function useMyGifts(guestCode) {
  const [gifts, setGifts] = useState([]);
  useEffect(() => {
    if (!guestCode) return undefined;
    let cancelled = false;
    giftService.getMyMpesaGifts(guestCode)
      .then(({ data }) => { if (!cancelled) setGifts(data?.gifts || []); })
      .catch(() => { /* the list is a courtesy: the card works without it */ });
    return () => { cancelled = true; };
  }, [guestCode]);
  return [gifts, setGifts];
}
