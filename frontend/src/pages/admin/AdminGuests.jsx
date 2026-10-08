import { useState, useEffect, useRef } from 'react';
import { Users, Plus, Edit, Trash2, FileImage, FileText, Upload, MessageCircle, ListChecks } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { guestService, invitationService } from '../../services/api';
import GuestModal from '../../components/admin/GuestModal';
import ImportConflictModal from '../../components/admin/ImportConflictModal';
import InvitationExportContainer from '../../components/admin/InvitationExportContainer';
import InvitationActionModal from '../../components/admin/InvitationActionModal';
import WhatsAppChecklistModal from '../../components/admin/WhatsAppChecklistModal';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminToolbar from '../../components/admin/AdminToolbar';
import AdminFloatingToolbar from '../../components/admin/AdminFloatingToolbar';
import Spinner from '../../components/admin/Spinner';
import GuestList from '../../components/admin/GuestList';
import GuestBulkActions from '../../components/admin/GuestBulkActions';
import { useGuests, useSettings, useContent } from '../../hooks/useApiHooks';
import { getWeddingInfo } from '../../utils/weddingInfo';
import { useSearch } from '../../context/SearchContext';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function AdminGuests() {
  const { data: guestsData, isLoading: guestsLoading, refetch: refetchGuests } = useGuests();
  const { data: settingsData } = useSettings();
  const { data: contentData } = useContent();

  const [guests, setGuests] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [loading, setLoading] = useState(false);
  const { searchQuery, setSearchQuery } = useSearch();
  const [sortBy, setSortBy] = useState('latest'); // 'latest' or 'alpha'
  const [filter, setFilter] = useState('all'); // all, confirmed, pending, declined
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
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
          toast.error('No guests with phone numbers to export.');
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
          toast.success(`WhatsApp kit ready for ${targets.length} guests`);
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

  const handleDelete = async (id) => {
    if (window.confirm('Delete this guest?')) {
      try {
        await guestService.delete(id);
        refetchGuests();
      } catch (e) { console.error(e); alert('Failed to delete'); }
    }
  };

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

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedIds.length} selected guests?`)) {
      try {
        await Promise.all(selectedIds.map(id => guestService.delete(id)));
        toast.success(`Deleted ${selectedIds.length} guests`);
        setSelectedIds([]);
        refetchGuests();
      } catch (e) { 
        console.error(e); 
        toast.error('Failed bulk delete'); 
      }
    }
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
    
    if (!window.confirm(`Send email invitations with custom cards to ${targets.length} guests?`)) return;
    
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

    if (!window.confirm(`Resend RSVP confirmation emails to ${targets.length} guests?`)) return;

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
            if (window.confirm(`Import ${res.data.valid.length} new guests?`)) {
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
      if (normalize(guest[field]) === normalize(value)) return;
      
      const updatedData = { ...guest, [field]: value };
      
      if (field === 'plus_ones_allowed') {
          updatedData[field] = parseInt(value, 10) || 0;
      }
      
      try {
          await guestService.update(guest.id, updatedData);
          refetchGuests();
      } catch (err) {
          console.error("Failed to update guest inline", err);
          alert('Failed to save update.');
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
          alert('Failed to create guest. Ensure name is provided.');
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

  const buildWhatsAppMessage = (guest, pdfUrl) => {
    const inviteUrl = `${window.location.origin}/invitation/${guest.unique_code}`;
    const pdfLine = pdfUrl ? `\n\nYour invitation card (PDF):\n${pdfUrl}` : '';
    return `Hi *${guest.name}*! 💌\n\nWe are so excited to invite you to our wedding!${pdfLine}\n\nYou can view your personalized digital invitation and RSVP here:\n${inviteUrl}\n\nWe can't wait to celebrate with you!\n— Dinah & Tze Ren`;
  };

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
      toast.success("Guest details updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update guest details");
    }
  };

  const handleResetAllRSVPs = async () => {
    if (!window.confirm("Are you sure you want to reset RSVP status for ALL guests to 'pending'? This will allow you to send fresh invitations.")) return;
    
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

  // Filter and Search logic
  const filteredGuests = guests.filter(guest => {
      const activeSearch = searchQuery || '';
      const searchLower = activeSearch.toLowerCase();
      const matchesSearch = guest.name.toLowerCase().includes(searchLower) || 
                            (guest.email && guest.email.toLowerCase().includes(searchLower));
      const matchesFilter = filter === 'all' ? true : guest.rsvp_status === filter;
      return matchesSearch && matchesFilter;
  }).sort((a, b) => {
      if (sortBy === 'alpha') return a.name.localeCompare(b.name);
      return b.id - a.id; // latest added first
  });

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
      variant: 'primary',
      onClick: handleAdd,
    },
    {
      id: 'import-excel',
      label: 'Import Excel',
      icon: Upload,
      onClick: () => fileInputRef.current?.click(),
      disabled: isImporting,
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
        hero={
          <AdminPageHero
            title="Guest List"
            description={`${guests.length} total guests`}
            breadcrumb="Guests"
            icon={<Users className="w-5 h-5 text-[#A67B5B]" />}
          />
        }
        toolbar={
          <AdminToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search guests by name, email, group..."
            filters={[
              { id: 'all', label: 'All' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'pending', label: 'Pending' },
              { id: 'declined', label: 'Declined' },
            ]}
            activeFilter={filter}
            onFilterChange={(f) => { setFilter(f); setCurrentPage(1); setSelectedIds([]); }}
            viewMode={viewMode}
            viewOptions={['list', 'spreadsheet']}
            onViewModeChange={setViewMode}
            sortOptions={[
              { id: 'latest', label: 'Latest Added' },
              { id: 'alpha', label: 'A → Z' },
            ]}
            activeSort={sortBy}
            onSortChange={setSortBy}
          />
        }
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
        totalPages={totalPages}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onInlineSave={handleInlineSave}
        onInlineCreate={handleInlineCreate}
        onInviteRequest={handleInviteRequest}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onUpdateGuest={handleUpdateGuest}
        onSetCurrentPage={setCurrentPage}
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
      </AdminPageLayout>
      {selectedIds.length === 0 && <AdminFloatingToolbar actions={toolbarActions} />}
    </>
  );
}
