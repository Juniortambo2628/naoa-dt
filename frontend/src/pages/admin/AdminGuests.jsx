import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Plus, Trash2, FileImage, FileText, Upload, MessageCircle, ListChecks, Download, UserCheck, Clock, UserX, Send, CopyCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { guestService, invitationService } from '../../services/api';
import GuestModal from '../../components/admin/GuestModal';
import ImportConflictModal from '../../components/admin/ImportConflictModal';
import InvitationExportContainer from '../../components/admin/InvitationExportContainer';
import InvitationActionModal from '../../components/admin/InvitationActionModal';
import WhatsAppChecklistModal from '../../components/admin/WhatsAppChecklistModal';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminSummaryCards from '../../components/admin/AdminSummaryCards';
import GuestMergeModal, { groupKey } from '../../components/admin/GuestMergeModal';
import Spinner from '../../components/admin/Spinner';
import GuestList from '../../components/admin/GuestList';
import GuestBulkActions from '../../components/admin/GuestBulkActions';
import { useGuests, useGuestDuplicates, useSettings, useContent } from '../../hooks/useApiHooks';
import { getWeddingInfo, getCoupleNames } from '../../utils/weddingInfo';
import { renderWhatsAppMessage } from '../../utils/whatsappMessage';
import { useSearch } from '../../context/SearchContext';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { confirmAction, promptAction, notifyError, notifyUndo } from '../../utils/feedback';
import { percent } from '../../utils/rsvp';
import useSavedViews from '../../hooks/useSavedViews';
import {
  STATUS_FILTERS, INVITE_FILTERS, NEEDS_FILTERS, DEFAULT_GUEST_FILTERS, DEFAULT_GUEST_SORT, GUEST_SORTS,
  filtersFromParams, filtersToParams, matchesGuestFilters, matchesGuestSearch, matchesStatus,
  guestStats, guestGroups, sortGuests, nextSort,
} from '../../utils/guests';

const IGNORED_DUPLICATES_KEY = 'admin.guests.ignoredDuplicates';

// "Not duplicates" decisions are a per-browser convenience.
function loadIgnoredDuplicates() {
  try {
    const stored = JSON.parse(localStorage.getItem(IGNORED_DUPLICATES_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveIgnoredDuplicates(keys) {
  try {
    localStorage.setItem(IGNORED_DUPLICATES_KEY, JSON.stringify(keys));
  } catch {
    // Storage unavailable (private mode); the choice lasts for this visit.
  }
}

export default function AdminGuests() {
  const { data: guestsData, isLoading: guestsLoading, refetch: refetchGuests } = useGuests();
  const { data: settingsData } = useSettings();
  const { data: contentData } = useContent();

  const [guests, setGuests] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [loading, setLoading] = useState(false);
  const { searchQuery, setSearchQuery } = useSearch();
  // Filters live in the URL (/guests?status=pending&invite=unsent) so dashboard
  // to-dos, analytics and bookmarks can deep-link. Default view: everyone still
  // expected (pending + confirmed); declined are one tap away.
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => filtersFromParams(searchParams));
  const [sort, setSort] = useState(DEFAULT_GUEST_SORT);
  const { views, saveView, deleteView } = useSavedViews('admin.guests.views');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const { data: duplicateData, refetch: refetchDuplicates } = useGuestDuplicates();
  const [ignoredDuplicateKeys, setIgnoredDuplicateKeys] = useState(loadIgnoredDuplicates);
  const [mergeModal, setMergeModal] = useState({ open: false, focusGuestId: null });
  const [, setSendingId] = useState(null);
  const [design, setDesign] = useState(null);
  const [exportingGuest, setExportingGuest] = useState(null);
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const exporterRef = useRef(null);
  
  // Spreadsheet View States
  const [viewMode, setViewMode] = useState('list');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteGuest, setInviteGuest] = useState(null);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExportingTracker, setIsExportingTracker] = useState(false);
  const [importData, setImportData] = useState(null); // { conflicts: [], valid: [], skipped_count: 0 }
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const fileInputRef = useRef(null);
  
  // Hover/Menu Persistence States
  const [showBulkMenu, setShowBulkMenu] = useState(null);

  useEffect(() => {
    if (guestsData) {
      const gData = guestsData.data || guestsData;
      setGuests(Array.isArray(gData) ? gData : []);
    }
  }, [guestsData]);

  // Follow links that change the query while this page is open (e.g. from the header).
  useEffect(() => {
    setFilters(filtersFromParams(searchParams));
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the URL itself changes
  }, [searchParams.toString()]);

  const applyFilters = (next) => {
    const merged = { ...filters, ...next };
    setFilters(merged);
    setCurrentPage(1);
    setSelectedIds([]);
    setSearchParams(filtersToParams(merged), { replace: true });
  };

  // Any change to the list (add, import, edit, merge) can create or resolve duplicates.
  useEffect(() => {
    if (guestsData) refetchDuplicates();
  }, [guestsData, refetchDuplicates]);

  const duplicateGroups = useMemo(
    () => (duplicateData?.groups || []).filter((g) => !ignoredDuplicateKeys.includes(groupKey(g))),
    [duplicateData, ignoredDuplicateKeys]
  );
  const duplicateIds = useMemo(
    () => new Set(duplicateGroups.flatMap((g) => g.guests.map((guest) => guest.id))),
    [duplicateGroups]
  );
  const extraDuplicateRecords = duplicateGroups.reduce((n, g) => n + g.guests.length - 1, 0);

  const openMergeModal = (guest = null) => setMergeModal({ open: true, focusGuestId: guest?.id ?? null });

  const handleMerge = async (keepId, mergeIds) => {
    try {
      const res = await guestService.merge(keepId, mergeIds);
      const count = mergeIds.length;
      toast.success(`Merged ${count} duplicate ${count === 1 ? 'record' : 'records'}${res.data?.name ? ` into ${res.data.name}` : ''}`);
      setSelectedIds((ids) => ids.filter((id) => !mergeIds.includes(id)));
      await refetchGuests();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to merge guests');
    }
  };

  const handleIgnoreDuplicates = (group) => {
    const next = [...ignoredDuplicateKeys, groupKey(group)];
    setIgnoredDuplicateKeys(next);
    saveIgnoredDuplicates(next);
    toast.success('Marked as different guests');
  };

  useEffect(() => {
    if (settingsData && settingsData.invitation_theme) {
        let loaded = settingsData.invitation_theme;
        if (typeof loaded === 'string') {
            try {
                loaded = JSON.parse(loaded);
            } catch (e) {
                console.error("Error parsing theme JSON", e);
            }
        }
        setDesign(loaded);
    }
  }, [settingsData]);

  // Convert a Blob (e.g. the generated PDF) into a base64 data URL so it can be
  // posted to the invitation send endpoint alongside the guest id.
  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  // Build the invitation attachment payload: a multi-page PDF with clickable
  // calendar/location links. Falls back to a PNG if PDF generation fails.
  const buildInvitePayload = async () => {
    if (!exporterRef.current) return {};
    try {
      const blob = await exporterRef.current.generatePdf();
      if (blob) {
        return { pdf_data: await blobToBase64(blob) };
      }
    } catch (err) {
      console.error('PDF generation failed, falling back to PNG', err);
    }
    const imageData = await exporterRef.current.generateImage();
    return { image_data: imageData };
  };

  const exportBulk = async (format = 'png') => {
      const targets = selectedIds.length > 0 
          ? guests.filter(g => selectedIds.includes(g.id)) 
          : filteredGuests;

      if (targets.length === 0) return;
      
      setIsBulkExporting(true);
      setBulkProgress({ current: 0, total: targets.length });
      
      const zip = new JSZip();
      const folder = zip.folder(`Invitations_${format.toUpperCase()}`);

      try {
          for (let i = 0; i < targets.length; i++) {
              const guest = targets[i];
              setBulkProgress({ current: i + 1, total: targets.length });
              setExportingGuest(guest);
              
              // Wait for render
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              if (format === 'png') {
                  const dataUrl = await exporterRef.current.generateImage();
                  if (dataUrl) {
                      const base64Data = dataUrl.split(',')[1];
                      folder.file(`${guest.name.replace(/\s+/g, '_')}.png`, base64Data, { base64: true });
                  }
              } else {
                  const blob = await exporterRef.current.generatePdf();
                  if (blob) {
                      folder.file(`${guest.name.replace(/\s+/g, '_')}.pdf`, blob);
                  }
              }
          }

          const content = await zip.generateAsync({ type: "blob" });
          saveAs(content, `Bulk_Invitations_${new Date().getTime()}.zip`);
          toast.success("Bulk export complete!");
      } catch (err) {
          console.error("Bulk export failed", err);
          toast.error("Failed some exports during bulk process.");
      } finally {
          setIsBulkExporting(false);
          setExportingGuest(null);
      }
  };


  // Download a "WhatsApp kit": every guest's personalised PDF plus an index.html
  // checklist with a one-tap link that opens each guest's chat with their own
  // message (incl. their unique RSVP link), so invites can be sent one by one.
  const exportWhatsAppKit = async () => {
      const pool = selectedIds.length > 0
          ? guests.filter(g => selectedIds.includes(g.id))
          : filteredGuests;
      const targets = pool.filter(g => g.phone);

      if (targets.length === 0) {
          toast.error(`None of the ${pool.length} guests have a phone number.`);
          return;
      }

      setIsBulkExporting(true);
      setBulkProgress({ current: 0, total: targets.length });

      const zip = new JSZip();
      const folder = zip.folder('PDFs');
      const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      const rows = [];

      try {
          for (let i = 0; i < targets.length; i++) {
              const guest = targets[i];
              setBulkProgress({ current: i + 1, total: targets.length });
              setExportingGuest(guest);
              await new Promise(resolve => setTimeout(resolve, 1000));

              const num = String(i + 1).padStart(3, '0');
              const fileName = `${num}_${guest.name.replace(/[^\w-]+/g, '_')}_${guest.unique_code}.pdf`;
              const blob = await exporterRef.current.generatePdf();
              if (blob) folder.file(fileName, blob);

              rows.push(`<tr>
  <td>${num}</td>
  <td><strong>${esc(guest.name)}</strong><br><small>${esc(guest.unique_code)}</small></td>
  <td>${esc(guest.phone)}</td>
  <td>${blob ? `<a href="PDFs/${esc(fileName)}" target="_blank">Open PDF</a>` : '<em>failed</em>'}</td>
  <td><a class="wa" href="${esc(whatsAppUrl(guest, buildWhatsAppMessage(guest)))}" target="_blank">Open chat</a></td>
</tr>`);
          }

          zip.file('index.html', `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>WhatsApp Invitations</title>
<style>body{font-family:system-ui,sans-serif;margin:16px;color:#292524}table{border-collapse:collapse;width:100%}td,th{padding:8px;border-bottom:1px solid #e7e5e4;text-align:left;font-size:14px}a.wa{background:#25D366;color:#fff;padding:6px 10px;border-radius:6px;text-decoration:none;white-space:nowrap}</style>
</head><body><h1>WhatsApp Invitations (${targets.length})</h1>
<p>For each guest: tap <b>Open chat</b> (the personal message and RSVP link are pre-filled), attach their PDF from the <code>PDFs</code> folder and send. Track progress with the <b>WhatsApp Checklist</b> in the admin dashboard — ticks there are saved.</p>
<table><thead><tr><th>#</th><th>Guest</th><th>Phone</th><th>Invite</th><th>WhatsApp</th></tr></thead><tbody>
${rows.join('\n')}
</tbody></table></body></html>`);

          const content = await zip.generateAsync({ type: 'blob' });
          saveAs(content, `WhatsApp_Invitations_${new Date().toISOString().slice(0, 10)}.zip`);
          const skipped = pool.length - targets.length;
          toast.success(`WhatsApp kit ready for ${targets.length} guests${skipped ? ` (${skipped} skipped — no phone number)` : ''}`, { duration: 6000 });
      } catch (err) {
          console.error('WhatsApp kit export failed', err);
          toast.error('Failed to build the WhatsApp kit.');
      } finally {
          setIsBulkExporting(false);
          setExportingGuest(null);
      }
  };

  const handleAdd = () => {
    setSelectedGuest(null);
    setModalOpen(true);
  };

  const handleEdit = (guest) => {
    setSelectedGuest(guest);
    setModalOpen(true);
  };

  // Deletes are soft on the server, so they can be undone from the toast.
  const deleteGuests = async (ids) => {
    const names = guests.filter(g => ids.includes(g.id)).map(g => g.name);
    const label = ids.length === 1 ? names[0] || 'this guest' : `${ids.length} guests`;
    if (!await confirmAction({ title: `Delete ${label}?`, message: 'You can undo this straight after.', confirmLabel: 'Delete' })) return;
    try {
      await guestService.bulkDelete(ids);
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
      refetchGuests();
      notifyUndo(`Deleted ${label}`, async () => {
        await guestService.restore(ids);
        refetchGuests();
      });
    } catch (e) {
      notifyError(e, 'Failed to delete');
    }
  };

  const handleDelete = (id) => deleteGuests([id]);

  const handleSave = async (data) => {
    try {
        if (selectedGuest) {
            await guestService.update(selectedGuest.id, data);
            toast.success('Guest updated successfully');
        } else {
            await guestService.create(data);
            toast.success('Guest added successfully');
        }
        refetchGuests();
        setModalOpen(false);
    } catch (err) {
        console.error(err);
        const errMsg = err.response?.data?.message || 'Failed to save guest. Check if email is unique.';
        toast.error(errMsg);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredGuests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredGuests.map(g => g.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => deleteGuests(selectedIds);

  // Bulk "Set group…" with existing groups suggested.
  const handleBulkSetGroup = async () => {
    const group = await promptAction({
      title: `Set group for ${selectedIds.length} guests`,
      label: 'Group',
      placeholder: 'e.g. Family',
      suggestions: guestGroups(guests),
      confirmLabel: 'Apply',
    });
    if (group) handleBulkUpdate({ group });
  };

  const handleBulkWhatsApp = async () => {
    toast(`Opening ${selectedIds.length} WhatsApp tabs...`, { icon: '💬' });
    for (const id of selectedIds) {
      const guest = guests.find(g => g.id === id);
      if (guest && guest.phone) {
        await handleWhatsAppInvite(guest);
        await new Promise(r => setTimeout(r, 500)); // Small delay between tabs
      }
    }
    setSelectedIds([]);
  };

  const handleBulkSendInvite = async () => {
    const targets = guests.filter(g => selectedIds.includes(g.id) && g.email);
    if (targets.length === 0) {
        toast.error("No selected guests with email addresses.");
        return;
    }
    
    if (!await confirmAction(`Send email invitations with custom cards to ${targets.length} guests?`)) return;
    
    setIsBulkExporting(true); // Re-use the bulk progress UI
    setBulkProgress({ current: 0, total: targets.length });
    
    try {
        for (let i = 0; i < targets.length; i++) {
            const guest = targets[i];
            setBulkProgress({ current: i + 1, total: targets.length });
            
            // Set the guest for the exporter to render
            setExportingGuest(guest);
            // Wait for render
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const payload = await buildInvitePayload();

            await invitationService.send(guest.id, payload);
        }
        toast.success(`Sent ${targets.length} invitations successfully!`);
        refetchGuests();
        setSelectedIds([]);
    } catch (err) {
        console.error("Bulk invite failed", err);
        toast.error("Bulk invitation process failed partially.");
    } finally {
        setIsBulkExporting(false);
        setExportingGuest(null);
        setBulkProgress({ current: 0, total: 0 });
    }
  };

  const handleBulkResendConfirmation = async () => {
    const targets = guests.filter(g => selectedIds.includes(g.id) && g.email && g.rsvp_status !== 'pending');
    if (targets.length === 0) {
        toast.error("No selected guests with email addresses who have already RSVP'd.");
        return;
    }

    if (!await confirmAction(`Resend RSVP confirmation emails to ${targets.length} guests?`)) return;

    try {
        setLoading(true);
        const res = await guestService.resendConfirmationBulk(targets.map(t => t.id));
        toast.success(res.data.message || `Sent confirmation emails successfully!`);
        setSelectedIds([]);
    } catch (err) {
        console.error("Bulk resend confirmation failed", err);
        toast.error("Failed to resend confirmation emails.");
    } finally {
        setLoading(false);
    }
  };

  const handleBulkUpdate = async (data) => {
    try {
      setLoading(true);
      await guestService.bulkUpdate(selectedIds, data);
      toast.success(`Updated ${selectedIds.length} guests`);
      setSelectedIds([]);
      refetchGuests();
    } catch (err) {
      console.error("Bulk update failed", err);
      toast.error("Bulk update failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
        const res = await guestService.validateImport(file);
        if (res.data.conflicts.length > 0) {
            setImportData(res.data);
            setConflictModalOpen(true);
        } else if (res.data.valid.length > 0) {
            if (await confirmAction(`Import ${res.data.valid.length} new guests?`)) {
                await guestService.confirmImport({ valid: res.data.valid });
                toast.success('Guests imported successfully!');
                refetchGuests();
            }
        } else {
            toast.error('No new guests found in the file.');
        }
    } catch (err) {
        console.error("Import validation failed", err);
        toast.error('Failed to validate file. Check format.');
    } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async (resolvedConflicts) => {
      setConflictModalOpen(false);
      setIsImporting(true);
      try {
          await guestService.confirmImport({
              valid: importData.valid,
              conflicts: resolvedConflicts
          });
          toast.success('Import completed successfully!');
          refetchGuests();
      } catch (err) {
          console.error("Import confirmation failed", err);
          toast.error("Failed to complete import.");
      } finally {
          setIsImporting(false);
          setImportData(null);
      }
  };

  const handleInlineSave = async (guest, field, value) => {
      // Small helper to normalize values for comparison
      const normalize = (val) => val === null || val === undefined ? '' : String(val);
      if (normalize(guest[field]) === normalize(value)) return 'unchanged';
      
      const updatedData = { ...guest, [field]: value };
      
      if (field === 'plus_ones_allowed') {
          updatedData[field] = parseInt(value, 10) || 0;
      }
      
      try {
          await guestService.update(guest.id, updatedData);
          refetchGuests();
          return 'saved';
      } catch (err) {
          notifyError(err, `Couldn't save ${field.replace(/_/g, ' ')} for ${guest.name}`);
          throw err; // the cell shows its error state
      }
  };

  const handleInlineCreate = async (index, field, value) => {
      if (!value.trim()) return;
      
      try {
          // Minimal payload for quick creation: Name and Group required
          const newGuestData = {
              name: field === 'name' ? value : `New Guest ${index + 1}`,
              group: 'Family',
              plus_ones_allowed: 0,
              email: null,
              [field]: value
          };
          
          await guestService.create(newGuestData);
          refetchGuests();
      } catch (err) {
          console.error("Failed to create guest inline", err);
          notifyError('Failed to create guest. Ensure name is provided.');
      }
  };

  const handleInviteRequest = (guest) => {
    setInviteGuest(guest);
    setIsInviteModalOpen(true);
  };

  const handleSendInvite = async (guest) => {
    setSendingId(guest.id);
    try {
        // Generate the invitation attachment before sending
        setExportingGuest(guest);
        // Wait for render so the exporter component can pick up the guest data
        await new Promise(resolve => setTimeout(resolve, 800));

        const payload = await buildInvitePayload();

        await invitationService.send(guest.id, payload);
        toast.success(`Invitation sent to ${guest.name} with card attached!`);
        refetchGuests();
    } catch (e) {
        console.error(e);
        toast.error('Failed to send email invitation');
    } finally {
        setExportingGuest(null);
        setSendingId(null);
    }
  };

  const handleExportTracker = async () => {
    setIsExportingTracker(true);
    try {
      const res = await guestService.exportTracker();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'guest-invite-tracker.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error('Failed to export invite tracker');
    } finally {
      setIsExportingTracker(false);
    }
  };

  const buildWhatsAppMessage = (guest, pdfUrl) => renderWhatsAppMessage(settingsData?.whatsapp_message_template, {
    name: guest.name,
    code: guest.unique_code,
    invite_link: `${window.location.origin}/invitation/${guest.unique_code}`,
    pdf_link: pdfUrl,
    couple: getCoupleNames(settingsData, contentData).coupleNames,
  });

  const whatsAppUrl = (guest, message) =>
    `https://wa.me/${guest.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;

  // Step 1: render the guest's invitation PDF, upload it (so the message can link
  // to it) and mark the invite as sent. Returns what step 2 needs to share it.
  const prepareWhatsAppInvite = async (guest) => {
    let file = null;
    let pdfUrl = null;
    try {
      setExportingGuest(guest);
      await new Promise(resolve => setTimeout(resolve, 800));
      const blob = exporterRef.current ? await exporterRef.current.generatePdf() : null;
      if (blob) {
        const fileName = `Invitation_${guest.name.replace(/\s+/g, '_')}.pdf`;
        file = new File([blob], fileName, { type: 'application/pdf' });
        const res = await guestService.markWhatsappInvite(guest.id, { pdf_data: await blobToBase64(blob) });
        pdfUrl = res?.data?.pdf_url || null;
      } else {
        await guestService.markWhatsappInvite(guest.id);
      }
      refetchGuests();
    } catch (e) {
      console.error('Failed to prepare WhatsApp invitation PDF', e);
    } finally {
      setExportingGuest(null);
    }
    return { guest, file, pdfUrl, message: buildWhatsAppMessage(guest, pdfUrl) };
  };

  // Step 2 (must run straight from a click): attach the PDF via the device share
  // sheet where supported (mobile, Chrome/Edge/Safari desktop); otherwise download
  // the PDF so it can be dropped into the chat, and open WhatsApp with the PDF link.
  const shareWhatsAppInvite = async ({ guest, file, message }) => {
    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: message });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
        console.error('Share failed, falling back to WhatsApp link', e);
      }
    }
    if (file) {
      saveAs(file, file.name);
      toast('PDF downloaded — attach it in the WhatsApp chat if needed', { icon: '📎' });
    }
    window.open(whatsAppUrl(guest, message), '_blank');
  };

  // Bulk: can't attach files across many chats, so each message links to the guest's PDF.
  const handleWhatsAppInvite = async (guest) => {
    const tab = window.open('', '_blank');
    const { message } = await prepareWhatsAppInvite(guest);
    if (tab) tab.location.href = whatsAppUrl(guest, message);
  };

  // WhatsApp checklist helpers
  const downloadGuestPdf = async (guest) => {
    try {
      setExportingGuest(guest);
      await new Promise(resolve => setTimeout(resolve, 800));
      const blob = exporterRef.current ? await exporterRef.current.generatePdf() : null;
      if (!blob) throw new Error('No PDF generated');
      saveAs(blob, `Invitation_${guest.name.replace(/[^\w-]+/g, '_')}_${guest.unique_code}.pdf`);
    } catch (e) {
      console.error('PDF download failed', e);
      toast.error(`Couldn't create the PDF for ${guest.name}`);
    } finally {
      setExportingGuest(null);
    }
  };

  const openGuestChat = (guest) => {
    window.open(whatsAppUrl(guest, buildWhatsAppMessage(guest)), '_blank');
  };

  const toggleWhatsAppSent = async (guest, sent) => {
    try {
      if (sent) await guestService.markWhatsappInvite(guest.id);
      else await guestService.unmarkWhatsappInvite(guest.id);
      refetchGuests();
    } catch (e) {
      toast.error('Failed to save — please try again');
      throw e;
    }
  };

  const handleUpdateGuest = async (guest, data) => {
    try {
      // Merge with existing guest data to ensure validation (like 'name') passes
      const payload = { ...guest, ...data };
      await guestService.update(guest.id, payload);
      refetchGuests();
      // Offer to put the changed fields back.
      const previous = Object.fromEntries(Object.keys(data).map(key => [key, guest[key] ?? null]));
      notifyUndo(`Updated ${guest.name}`, async () => {
        await guestService.update(guest.id, { ...guest, ...previous });
        refetchGuests();
      });
    } catch (err) {
      notifyError(err, 'Failed to update guest details');
    }
  };

  const handleResetAllRSVPs = async () => {
    if (!await confirmAction("Are you sure you want to reset RSVP status for ALL guests to 'pending'? This will allow you to send fresh invitations.")) return;
    
    try {
        const allIds = guests.map(g => g.id);
        if (allIds.length === 0) return;
        
        toast.loading("Resetting statuses...", { id: 'reset-rsvp' });
        await guestService.bulkUpdate(allIds, { rsvp_status: 'pending' });
        refetchGuests();
        toast.success("All RSVP statuses reset successfully", { id: 'reset-rsvp' });
    } catch (err) {
        console.error(err);
        toast.error("Failed to reset RSVP statuses", { id: 'reset-rsvp' });
    }
  };

  // Filter, search and sort
  const filterContext = { duplicateIds };
  const filteredGuests = sortGuests(
    guests.filter(guest => matchesGuestSearch(guest, searchQuery) && matchesGuestFilters(guest, filters, filterContext)),
    sort
  );

  const stats = useMemo(() => guestStats(guests), [guests]);
  const groupNames = useMemo(() => guestGroups(guests), [guests]);

  const changeFilter = (status) => applyFilters({ status });
  // Counts for each option, holding the other filters as they are.
  const countWith = (next) => guests.filter(g => matchesGuestSearch(g, searchQuery) && matchesGuestFilters(g, { ...filters, ...next }, filterContext)).length;

  const saveCurrentView = async () => {
    const name = await promptAction({ title: 'Save this view', label: 'Name', placeholder: 'e.g. Family, not invited yet' });
    if (name) saveView(name, { filters, sort, search: searchQuery || '' });
  };
  const applyView = (id) => {
    const view = views.find(v => v.id === id);
    if (!view) return;
    applyFilters({ ...DEFAULT_GUEST_FILTERS, ...view.state.filters });
    setSort(view.state.sort || DEFAULT_GUEST_SORT);
    setSearchQuery(view.state.search || '');
  };

  const summaryCards = [
    {
      label: 'Invited',
      value: stats.total,
      icon: Users,
      color: '#A67B5B',
      hint: `${stats.plusOnes} plus-ones`,
      onClick: () => changeFilter('all'),
      active: filters.status === 'all',
    },
    {
      label: 'Confirmed',
      value: stats.confirmed,
      icon: UserCheck,
      color: '#6B8E5A',
      hint: `${percent(stats.confirmed, stats.total)} · headcount`,
      onClick: () => changeFilter('confirmed'),
      active: filters.status === 'confirmed',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: '#D4935A',
      hint: `${percent(stats.responded, stats.total)} replied`,
      onClick: () => changeFilter('pending'),
      active: filters.status === 'pending',
    },
    {
      label: 'Declined',
      value: stats.declined,
      icon: UserX,
      color: '#C0756B',
      hint: `${percent(stats.declined, stats.total)} of invited`,
      onClick: () => changeFilter('declined'),
      active: filters.status === 'declined',
    },
    {
      label: 'Invites Sent',
      value: stats.invitesSent,
      icon: Send,
      color: '#7D8FA6',
      hint: `${stats.total - stats.invitesSent} not sent`,
    },
    {
      label: 'Duplicates',
      value: extraDuplicateRecords,
      icon: CopyCheck,
      color: extraDuplicateRecords > 0 ? '#C9962B' : '#8B9A7D',
      hint: extraDuplicateRecords > 0 ? 'Review & merge' : 'None found',
      onClick: () => openMergeModal(),
    },
  ];

  const totalPages = Math.ceil(filteredGuests.length / itemsPerPage);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredGuests.length, totalPages, currentPage]);

  const pagedGuests = filteredGuests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toolbarActions = [
    {
      id: 'add-guest',
      label: 'Add Guest',
      icon: Plus,
      variant: 'secondary',
      onClick: handleAdd,
    },
    {
      id: 'merge-duplicates',
      label: `Merge Duplicates (${extraDuplicateRecords})`,
      icon: CopyCheck,
      onClick: () => openMergeModal(),
      hidden: extraDuplicateRecords === 0,
    },
    {
      id: 'import-excel',
      label: 'Import Excel',
      icon: Upload,
      onClick: () => fileInputRef.current?.click(),
      disabled: isImporting,
    },
    {
      id: 'export-tracker',
      label: 'Export Invite Tracker',
      icon: Download,
      onClick: handleExportTracker,
      disabled: isExportingTracker,
    },
    {
      id: 'export-images',
      label: 'Export Images',
      icon: FileImage,
      onClick: () => exportBulk('png'),
      disabled: isBulkExporting,
    },
    {
      id: 'export-pdfs',
      label: 'Export PDFs',
      icon: FileText,
      onClick: () => exportBulk('pdf'),
      disabled: isBulkExporting,
    },
    {
      id: 'whatsapp-checklist',
      label: 'WhatsApp Checklist',
      icon: ListChecks,
      onClick: () => setIsChecklistOpen(true),
    },
    {
      id: 'whatsapp-kit',
      label: 'WhatsApp Kit',
      icon: MessageCircle,
      onClick: exportWhatsAppKit,
      disabled: isBulkExporting,
    },
    {
      id: 'reset-rsvps',
      label: 'Reset RSVPs',
      icon: Trash2,
      variant: 'danger',
      onClick: handleResetAllRSVPs,
    },
  ];

  return (
    <>
      <AdminPageLayout
        fill
        hero={
          <AdminPageHero
            title="Guest List"
            description={`${filteredGuests.length} of ${guests.length} guests shown`}
            breadcrumb="Guests"
            icon={<Users className="w-5 h-5 text-[#A67B5B]" />}
          />
        }
        summary={<AdminSummaryCards cards={summaryCards} columns={6} />}
        actions={toolbarActions}
        toolbarHidden={selectedIds.length > 0}
        search="Search guests…"
        filters={{
          groups: [
            {
              id: 'status',
              label: 'RSVP status',
              defaultValue: DEFAULT_GUEST_FILTERS.status,
              value: filters.status,
              onChange: changeFilter,
              options: STATUS_FILTERS.map(f => ({ ...f, count: guests.filter(g => matchesStatus(g, f.id)).length })),
            },
            {
              id: 'invite',
              label: 'Invitation',
              defaultValue: DEFAULT_GUEST_FILTERS.invite,
              value: filters.invite,
              onChange: (invite) => applyFilters({ invite }),
              options: INVITE_FILTERS.map(f => ({ ...f, count: countWith({ invite: f.id }) })),
            },
            {
              id: 'group',
              label: 'Group',
              defaultValue: DEFAULT_GUEST_FILTERS.group,
              value: filters.group,
              onChange: (group) => applyFilters({ group }),
              options: [{ id: 'all', label: 'All groups' }, ...groupNames.map(g => ({ id: g, label: g, count: countWith({ group: g }) }))],
            },
            {
              id: 'needs',
              label: 'Needs attention',
              defaultValue: DEFAULT_GUEST_FILTERS.needs,
              value: filters.needs,
              onChange: (needs) => applyFilters({ needs }),
              options: NEEDS_FILTERS.map(f => ({ ...f, count: f.id === 'none' ? undefined : countWith({ needs: f.id }) })),
            },
          ],
          sort: {
            options: Object.entries(GUEST_SORTS).flatMap(([key, { label }]) => [
              { id: `${key}:asc`, label: `${label} ↑` },
              { id: `${key}:desc`, label: `${label} ↓` },
            ]),
            value: `${sort.key}:${sort.dir}`,
            defaultValue: `${DEFAULT_GUEST_SORT.key}:${DEFAULT_GUEST_SORT.dir}`,
            onChange: (value) => { const [key, dir] = value.split(':'); setSort({ key, dir }); },
          },
          view: { options: ['list', 'spreadsheet'], value: viewMode, onChange: setViewMode },
          views: { items: views, onApply: applyView, onSave: saveCurrentView, onDelete: deleteView },
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".xlsx, .xls, .csv" 
          onChange={handleImport} 
        />

        <GuestBulkActions
        selectedIds={selectedIds}
        showBulkMenu={showBulkMenu}
        setShowBulkMenu={setShowBulkMenu}
        isBulkExporting={isBulkExporting}
        loading={loading}
        onBulkUpdate={handleBulkUpdate}
        onBulkWhatsApp={handleBulkWhatsApp}
        onBulkSendInvite={handleBulkSendInvite}
        onBulkResendConfirmation={handleBulkResendConfirmation}
        onExportBulk={exportBulk}
        onExportWhatsAppKit={exportWhatsAppKit}
        onBulkDelete={handleBulkDelete}
        onBulkSetGroup={handleBulkSetGroup}
        onClearSelection={() => { setSelectedIds([]); setShowBulkMenu(null); }}
      />

      {isBulkExporting && (
          <div className="bg-[#A67B5B]/10 border border-[#A67B5B]/20 p-4 rounded-xl flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                  <Spinner size="sm" className="text-[#A67B5B]" />
                  <div>
                      <p className="text-sm font-medium text-stone-800">Generating Bulk Invitations...</p>
                      <p className="text-xs text-stone-500">Processing guest {bulkProgress.current} of {bulkProgress.total}: {exportingGuest?.name}</p>
                  </div>
              </div>
              <div className="w-48 bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#A67B5B] h-full transition-all duration-300"
                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                  />
              </div>
          </div>
      )}

      <GuestList
        guestsLoading={guestsLoading}
        filteredGuests={filteredGuests}
        pagedGuests={pagedGuests}
        viewMode={viewMode}
        selectedIds={selectedIds}
        searchQuery={searchQuery}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onSetItemsPerPage={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
        duplicateIds={duplicateIds}
        onReviewDuplicates={openMergeModal}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onInlineSave={handleInlineSave}
        onInlineCreate={handleInlineCreate}
        onInviteRequest={handleInviteRequest}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onUpdateGuest={handleUpdateGuest}
        onSetCurrentPage={setCurrentPage}
        sort={sort}
        onAdd={handleAdd}
        onSort={(key) => setSort(prev => nextSort(prev, key))}
      />

      <WhatsAppChecklistModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        guests={filteredGuests}
        onDownloadPdf={downloadGuestPdf}
        onOpenChat={openGuestChat}
        onToggleSent={toggleWhatsAppSent}
      />

      <InvitationActionModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        guest={inviteGuest}
        onSendEmail={handleSendInvite}
        onPrepareWhatsApp={prepareWhatsAppInvite}
        onShareWhatsApp={shareWhatsAppInvite}
        onUpdateGuest={handleUpdateGuest}
      />

      <GuestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        guest={selectedGuest}
        onSave={handleSave}
        allGuests={guests}
      />
      
      {design && (
          <InvitationExportContainer
              design={design}
              guest={exportingGuest}
              weddingSettings={getWeddingInfo(settingsData, contentData)}
              onReady={(methods) => {
                  exporterRef.current = methods;
              }}
          />
      )}
      {conflictModalOpen && importData && (
          <ImportConflictModal 
            isOpen={conflictModalOpen}
            onClose={() => setConflictModalOpen(false)}
            conflicts={importData.conflicts}
            validCount={importData.valid.length}
            onConfirm={handleConfirmImport}
          />
      )}
      <GuestMergeModal
        isOpen={mergeModal.open}
        onClose={() => setMergeModal({ open: false, focusGuestId: null })}
        groups={duplicateGroups}
        focusGuestId={mergeModal.focusGuestId}
        onMerge={handleMerge}
        onIgnore={handleIgnoreDuplicates}
      />
      </AdminPageLayout>
    </>
  );
}
