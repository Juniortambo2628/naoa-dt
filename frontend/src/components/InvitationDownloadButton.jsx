import { lazy, Suspense, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';
import Button from './Button';

// The PDF exporter (html-to-image + jsPDF) is only loaded when a guest asks
// for their invitation, keeping the invitation page itself light.
const InvitationExportContainer = lazy(() => import('./admin/InvitationExportContainer'));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const safeName = (text) => String(text || '').replace(/[\\/:*?"<>|]+/g, '').trim();

/**
 * Lets a guest download their personalised invitation as a PDF — the same
 * file the couple sends from the admin (every page, clickable calendar and
 * map links).
 *
 * Renders the shared <Button>; `variant`, `size` and `fullWidth` are passed
 * through, `className` is for layout only.
 */
export default function InvitationDownloadButton({
  design,
  guest,
  weddingSettings,
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  className = '',
}) {
  const [active, setActive] = useState(false); // exporter mounted
  const [busy, setBusy] = useState(false);
  const exporterRef = useRef(null);

  const download = async () => {
    if (busy) return;
    setBusy(true);
    setActive(true);
    try {
      // Wait for the lazily loaded exporter to mount and report its methods.
      const started = Date.now();
      while (!exporterRef.current && Date.now() - started < 20000) await sleep(100);
      if (!exporterRef.current) throw new Error('Invitation exporter did not load');
      await sleep(500); // let fonts and images settle

      const blob = await exporterRef.current.generatePdf();
      if (!blob) throw new Error('PDF generation returned nothing');
      const couple = safeName(weddingSettings?.couple_names);
      saveAs(blob, `${couple ? `${couple} - ` : ''}Invitation - ${safeName(guest?.name) || 'Guest'}.pdf`);
    } catch (err) {
      console.error('Invitation download failed', err);
      toast.error("Sorry, we couldn't prepare your invitation. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        icon={Download}
        loading={busy}
        onClick={download}
        className={className}
      >
        {busy ? 'Preparing your invitation…' : 'Download Invitation (PDF)'}
      </Button>

      {active && (
        <Suspense fallback={null}>
          <InvitationExportContainer
            design={design}
            guest={guest}
            weddingSettings={weddingSettings}
            onReady={(methods) => { exporterRef.current = methods; }}
          />
        </Suspense>
      )}
    </>
  );
}
