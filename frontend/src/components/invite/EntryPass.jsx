import { QRCodeSVG } from 'qrcode.react';
import { Monogram } from '../HeritageMotifs';
import { inviteUrl, tableLabel } from '../../utils/usherKit';

/**
 * The guest's entry pass: their QR (the same one printed on their guest card)
 * for the ushers to scan at the door.
 */
export default function EntryPass({ guestCode, guest = null }) {
  const code = guest?.unique_code || guestCode;
  const link = inviteUrl(code);
  const table = guest?.table?.name;

  return (
    <div className="flex flex-col items-center text-center px-2 py-2">
      <Monogram size={34} />
      <p className="mt-2 text-[11px] tracking-[0.3em] uppercase text-stone-500">Entry pass</p>
      {guest?.name && <p className="mt-1 font-serif text-2xl text-stone-800">{guest.name}</p>}
      {table && <p className="mt-1 text-xs font-bold tracking-[0.18em] uppercase text-stone-700">{tableLabel(table)}</p>}

      <div className="mt-4 rounded-2xl bg-white p-3 border border-[#E4D6C2] shadow-sm">
        {link ? (
          <QRCodeSVG value={link} size={180} level="M" fgColor="#2E2722" bgColor="#FFFFFF" title="Your entry QR code" />
        ) : (
          <p className="w-[180px] py-14 text-sm text-stone-500">Your pass will appear here.</p>
        )}
      </div>

      <p className="mt-3 text-sm text-stone-600 max-w-xs">
        Show this at the entrance and an usher will scan it. Turn your screen brightness up if it doesn&apos;t scan straight away.
      </p>
      {code && <p className="mt-2 text-xs text-stone-500">Invite code <span className="font-mono tracking-wider text-stone-700">{code}</span></p>}
    </div>
  );
}
