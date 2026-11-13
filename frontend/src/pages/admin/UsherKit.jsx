import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Download, ClipboardList, Users, CheckCircle2, Clock, FileArchive } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';
import { useGuests, useTables } from '../../hooks/useApiHooks';
import { useContent } from '../../context/ContentContext';
import { guestService } from '../../services/api';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminCard from '../../components/admin/AdminCard';
import SegmentedControl from '../../components/SegmentedControl';
import { Monogram } from '../../components/HeritageMotifs';
import { getCoupleNames, getWeddingDateText } from '../../utils/weddingInfo';
import { usherRows, chunk, tableLabel, inviteUrl, cardFileName, WHO_OPTIONS, SORT_OPTIONS } from '../../utils/usherKit';
import './usher-kit.css';

const CARAMEL = '#C4A385';
const CARDS_PER_PAGE = 6;
/** A card's size in mm (matches .usher-card in usher-kit.css). */
const CARD_MM = { w: 90, h: 86 };

/** One printable guest card: the invitation card, in fine lines only (cheap to print). */
function GuestCard({ guest, couple, dateText, venue }) {
  const link = inviteUrl(guest.code);
  return (
    <div className="usher-card" data-card-id={guest.id}>
      <div className="usher-card-inner">
        <Monogram size={26} />
        <p className="usher-card-eyebrow">Welcome</p>
        <p className="usher-card-name">{guest.name}</p>
        <span className="usher-card-rule" aria-hidden="true" />
        <p className="usher-card-couple">{couple}</p>
        <p className="usher-card-meta">{dateText}{venue ? ` · ${venue}` : ''}</p>
        {guest.table && <p className="usher-card-table">{tableLabel(guest.table)}</p>}
        {link && (
          <div className="usher-card-qr">
            <QRCodeSVG value={link} size={64} level="M" fgColor="#3F3731" bgColor="#FFFFFF" title={`Invitation for ${guest.name}`} />
            <span>Scan for your invitation</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** The ushers' checklist: one row per guest, with a tick box. */
function GuestListSheet({ rows, couple, dateText, venue, who, sort }) {
  const confirmed = rows.filter((r) => r.status === 'confirmed').length;
  return (
    <section className="usher-sheet">
      <header className="usher-sheet-head">
        <div>
          <h1>Guest list for ushers</h1>
          <p>{couple} · {dateText}{venue ? ` · ${venue}` : ''}</p>
        </div>
        <p className="usher-sheet-count">
          {rows.length} guests · {confirmed} confirmed
          <br />
          <span>{WHO_OPTIONS.find((o) => o.value === who)?.label} · {SORT_OPTIONS.find((o) => o.value === sort)?.label}</span>
        </p>
      </header>
      <table className="usher-table">
        <thead>
          <tr>
            <th className="usher-col-tick">In</th>
            <th>Guest</th>
            <th>Table</th>
            <th>Group</th>
            <th>RSVP</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="usher-col-tick"><span className={`usher-box ${r.checkedIn ? 'is-in' : ''}`} aria-label={r.checkedIn ? 'Checked in' : 'Not checked in'} /></td>
              <td>
                <span className="usher-guest">{r.name}</span>
                {r.guestOf && <span className="usher-sub">Guest of {r.guestOf}</span>}
              </td>
              <td className="usher-table-no">{r.table || '—'}</td>
              <td>{r.group || '—'}</td>
              <td>{r.statusLabel}</td>
              <td className="usher-notes">{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function CardSheets({ rows, couple, dateText, venue }) {
  return chunk(rows, CARDS_PER_PAGE).map((page, i) => (
    <section key={i} className="usher-cards-page">
      {page.map((guest) => (
        <GuestCard key={guest.id} guest={guest} couple={couple} dateText={dateText} venue={venue} />
      ))}
    </section>
  ));
}

/**
 * Usher kit: a printable guest list (tick as guests arrive) and printable
 * guest cards drawn from the invitation card, in fine lines with no fills so
 * they cost little to print. "Print / save as PDF" prints only the kit.
 */
export default function UsherKit() {
  const { data: guests = [], isLoading } = useGuests();
  const { data: tables = [] } = useTables();
  const { contents, settings } = useContent();
  const [who, setWho] = useState('expected');
  const [sort, setSort] = useState('name');
  const [include, setInclude] = useState('both');
  const [downloading, setDownloading] = useState(false);
  // One PDF per guest card, zipped: progress while it runs.
  const [zipProgress, setZipProgress] = useState(null);
  const exportRef = useRef(null);

  const { coupleNames: couple } = getCoupleNames(contents, settings);
  const dateText = getWeddingDateText(contents, 'en', settings);
  const venue = settings?.venue_name || '';

  const rows = useMemo(
    () => usherRows(Array.isArray(guests) ? guests : [], Array.isArray(tables) ? tables : tables?.data || [], { who, sort }),
    [guests, tables, who, sort]
  );

  const showList = include !== 'cards';
  const showCards = include !== 'list';

  const downloadSpreadsheet = async () => {
    setDownloading(true);
    try {
      const res = await guestService.export();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'guest-list.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const exportCardsZip = async () => {
    setZipProgress({ done: 0, total: rows.length });
    // Let the off-screen cards render and the fonts settle.
    await new Promise((r) => setTimeout(r, 400));
    if (document.fonts?.ready) await document.fonts.ready;
    try {
      const zip = new JSZip();
      const used = new Set();
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        const node = exportRef.current?.querySelector(`[data-card-id="${row.id}"]`);
        if (!node) continue;
        // JPEG keeps each PDF small (~100–200 KB) while staying sharp at 300 dpi.
        const jpg = await toJpeg(node, { pixelRatio: 3, quality: 0.9, backgroundColor: '#FFFFFF', cacheBust: true });
        const pdf = new jsPDF({ unit: 'mm', format: [CARD_MM.w, CARD_MM.h], orientation: 'landscape', compress: true });
        pdf.addImage(jpg, 'JPEG', 0, 0, CARD_MM.w, CARD_MM.h);
        let name = cardFileName(row);
        if (used.has(name)) name = name.replace(/\.pdf$/, `-${row.code || row.id}.pdf`);
        used.add(name);
        zip.file(name, pdf.output('blob'));
        setZipProgress({ done: i + 1, total: rows.length });
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'Guest_Cards.zip');
      toast.success(`${rows.length} guest cards saved`);
    } catch (err) {
      console.error('Card export failed', err);
      toast.error('Could not make the guest card PDFs');
    } finally {
      setZipProgress(null);
    }
  };

  const kit = (
    <>
      {showList && <GuestListSheet rows={rows} couple={couple} dateText={dateText} venue={venue} who={who} sort={sort} />}
      {showCards && <CardSheets rows={rows} couple={couple} dateText={dateText} venue={venue} />}
    </>
  );

  const counts = {
    total: rows.length,
    confirmed: rows.filter((r) => r.status === 'confirmed').length,
    pending: rows.filter((r) => r.status === 'pending').length,
  };

  return (
    <AdminPageLayout
      hero={(
        <AdminPageHero
          title="Usher Kit"
          description="A printable guest list for the ushers, and guest cards to hand out at the door."
          breadcrumb={[{ label: 'Guests', path: '/admin/dashboard/guests' }, { label: 'Usher Kit' }]}
          icon={<ClipboardList className="w-5 h-5 text-[#A67B5B]" />}
        />
      )}
      actions={[
        { id: 'print-kit', label: 'Print / Save as PDF', icon: Printer, variant: 'secondary', onClick: () => window.print(), disabled: isLoading || rows.length === 0 },
        {
          id: 'cards-zip',
          readOnly: true,
          label: zipProgress ? `Making cards ${zipProgress.done}/${zipProgress.total}…` : 'Cards as PDFs (ZIP)',
          icon: FileArchive,
          onClick: exportCardsZip,
          disabled: Boolean(zipProgress) || isLoading || rows.length === 0,
        },
        { id: 'download-guests', readOnly: true, label: downloading ? 'Preparing…' : 'Download spreadsheet', icon: Download, onClick: downloadSpreadsheet, disabled: downloading },
      ]}
    >
      <div className="space-y-6">
        <AdminCard>
          <div className="flex flex-wrap items-end gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-600">Guests</p>
              <SegmentedControl size="sm" aria-label="Which guests" options={WHO_OPTIONS} value={who} onChange={setWho} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-600">Order</p>
              <SegmentedControl size="sm" aria-label="Order" options={SORT_OPTIONS} value={sort} onChange={setSort} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-600">Print</p>
              <SegmentedControl
                size="sm"
                aria-label="What to print"
                options={[{ value: 'both', label: 'List and cards' }, { value: 'list', label: 'List only' }, { value: 'cards', label: 'Cards only' }]}
                value={include}
                onChange={setInclude}
              />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-sm text-stone-600">
            <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4 text-[#A67B5B]" />{counts.total} guests</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-600" />{counts.confirmed} confirmed</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-600" />{counts.pending} awaiting reply</span>
            <span className="text-stone-500">Cards print {CARDS_PER_PAGE} to an A4 page, in fine lines only (little ink). Cut along the faint edges. Each card&apos;s QR opens the guest&apos;s invitation, and checks them in when the ushers scan it.</span>
          </div>
        </AdminCard>

        {/* On-screen preview of exactly what prints */}
        <div className="usher-preview rounded-2xl border border-stone-200 bg-stone-100 p-4 sm:p-6 overflow-x-auto">
          {isLoading ? (
            <p className="text-center text-stone-500 py-16">Loading guests…</p>
          ) : rows.length === 0 ? (
            <p className="text-center text-stone-500 py-16">No guests match these options.</p>
          ) : (
            <div className="usher-kit usher-kit-screen">{kit}</div>
          )}
        </div>
      </div>

      {/* Off-screen cards, one per guest, for the PDF/ZIP export */}
      {zipProgress && createPortal(
        <div ref={exportRef} className="usher-kit usher-export" aria-hidden="true">
          {rows.map((guest) => <GuestCard key={guest.id} guest={guest} couple={couple} dateText={dateText} venue={venue} />)}
        </div>,
        document.body
      )}

      {/* The printed copy: only this prints (see usher-kit.css) */}
      {rows.length > 0 && createPortal(<div className="usher-kit usher-kit-print" style={{ '--usher-line': CARAMEL }}>{kit}</div>, document.body)}
    </AdminPageLayout>
  );
}
