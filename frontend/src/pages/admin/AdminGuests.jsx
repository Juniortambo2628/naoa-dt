import { useState, useEffect, useRef } from 'react';
import { Users, Search, Filter, Plus, Edit, Trash2, Check, Download, Loader2, Mail, Send, FileImage, FileText, Package, List, Grid, Upload, MessageCircle, X, ChevronDown, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { guestService, invitationService, settingService } from '../../services/api';
import GuestModal from '../../components/admin/GuestModal';
import ImportConflictModal from '../../components/admin/ImportConflictModal';
import InvitationExportContainer from '../../components/admin/InvitationExportContainer';
import InvitationActionModal from '../../components/admin/InvitationActionModal';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminToolbar from '../../components/admin/AdminToolbar';
import { useGuests, useSettings, useContent } from '../../hooks/useApiHooks';
import { useSearch } from '../../context/SearchContext';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function AdminGuests() {
  const { data: guestsData, isLoading: guestsLoading, refetch: refetchGuests } = useGuests();
  const { data: settingsData, isLoading: settingsLoading } = useSettings();
  const { data: contentData } = useContent();

  const [guests, setGuests] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [loading, setLoading] = useState(false);
  const { searchQuery } = useSearch();
  const [filter, setFilter] = useState('all'); // all, confirmed, pending, declined
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [sendingId, setSendingId] = useState(null);
  const [design, setDesign] = useState(null);
  const [exportingGuest, setExportingGuest] = useState(null);
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const exporterRef = useRef(null);
  
  // Spreadsheet View States
  const [viewMode, setViewMode] = useState('list');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteGuest, setInviteGuest] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState(null); // { conflicts: [], valid: [], skipped_count: 0 }
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const fileInputRef = useRef(null);
  
  // Hover/Menu Persistence States
  const [showBulkMenu, setShowBulkMenu] = useState(null);
  const [hoveredGuestId, setHoveredGuestId] = useState(null);
  const bulkMenuTimer = useRef(null);
  const guestMenuTimer = useRef(null);

  const handleMouseEnterBulk = () => {
      if (bulkMenuTimer.current) clearTimeout(bulkMenuTimer.current);
      setShowBulkMenu(true);
  };

  const handleMouseLeaveBulk = () => {
      bulkMenuTimer.current = setTimeout(() => {
          setShowBulkMenu(false);
      }, 300); // 300ms persistence delay
  };

  const handleMouseEnterGuest = (id) => {
      if (guestMenuTimer.current) clearTimeout(guestMenuTimer.current);
      setHoveredGuestId(id);
  };

  const handleMouseLeaveGuest = () => {
      guestMenuTimer.current = setTimeout(() => {
          setHoveredGuestId(null);
      }, 300); // 300ms persistence delay
  };

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

  const exportSingle = async (guest, format = 'png') => {
      setExportingGuest(guest);
      // Wait for React to render the exporter with the new guest
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
          if (format === 'png') {
              const dataUrl = await exporterRef.current.generateImage();
              if (dataUrl) {
                  saveAs(dataUrl, `Invitation_${guest.name.replace(/\s+/g, '_')}.png`);
              }
          } else {
              const blob = await exporterRef.current.generatePdf();
              if (blob) {
                  saveAs(blob, `Invitation_${guest.name.replace(/\s+/g, '_')}.pdf`);
              }
          }
      } catch (err) {
          console.error("Export failed", err);
          alert("Failed to export invitation.");
      } finally {
          setExportingGuest(null);
      }
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
        handleWhatsAppInvite(guest);
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
            
            let imageData = null;
            if (exporterRef.current) {
                imageData = await exporterRef.current.generateImage();
            }
            
            await invitationService.send(guest.id, { image_data: imageData });
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
        // Generate invitation image before sending
        setExportingGuest(guest);
        // Wait for render so the exporter component can pick up the guest data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        let imageData = null;
        if (exporterRef.current) {
            imageData = await exporterRef.current.generateImage();
        }
        
        await invitationService.send(guest.id, { image_data: imageData });
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

  const handleWhatsAppInvite = async (guest) => {
    const inviteUrl = `${window.location.origin}/invitation/${guest.unique_code}`;
    const message = `Hi *${guest.name}*! 💌\n\nWe are so excited to invite you to our wedding!\n\nYou can view your personalized digital invitation and RSVP here:\n${inviteUrl}\n\nWe can't wait to celebrate with you!\n— Dinah & Tze Ren`;
    
    const whatsappUrl = `https://wa.me/${guest.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Mark as sent in backend
    try {
        await guestService.markWhatsappInvite(guest.id);
        refetchGuests();
    } catch (e) {
        console.error("Failed to mark WhatsApp as sent", e);
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

  const handleResetRSVP = async (guest) => {
    if (!window.confirm(`Reset RSVP status for ${guest.name}? This will remove their current response.`)) return;
    
    try {
        await guestService.resetRSVP(guest.id);
        toast.success(`RSVP reset for ${guest.name}`);
        refetchGuests();
    } catch (err) {
        console.error(err);
        toast.error("Failed to reset RSVP");
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
  });

  const totalPages = Math.ceil(filteredGuests.length / itemsPerPage);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredGuests.length, totalPages, currentPage]);

  const pagedGuests = filteredGuests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Guest List"
        description={`${guests.length} total guests`}
        breadcrumb={[
          { label: 'Dashboard', path: '/admin/dashboard' },
          { label: 'Guests' },
        ]}
        icon={<Users className="w-5 h-5 text-[#A67B5B]" />}
        actions={
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg border border-stone-200 p-1 flex">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-stone-100 text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('spreadsheet')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'spreadsheet' ? 'bg-stone-100 text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
                  title="Spreadsheet View"
                >
                  <Grid className="w-4 h-4" />
                </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleImport} 
            />

            <div className="relative group">
                <button className="btn-secondary flex items-center gap-2">
                    Actions <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-stone-100 rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <button 
                        onClick={handleAdd}
                        className="w-full text-left px-4 py-2 hover:bg-[#A67B5B]/10 text-sm flex items-center gap-2 text-[#A67B5B] font-semibold border-b border-stone-50"
                    >
                        <Plus className="w-4 h-4" /> Add Guest
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isImporting}
                        className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm flex items-center gap-2 text-stone-600"
                    >
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Import Excel
                    </button>
                    <button 
                        onClick={() => exportBulk('png')} 
                        disabled={isBulkExporting}
                        className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm flex items-center gap-2 text-stone-600"
                    >
                        <FileImage className="w-4 h-4" /> Export Images
                    </button>
                    <button 
                        onClick={() => exportBulk('pdf')} 
                        disabled={isBulkExporting}
                        className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm flex items-center gap-2 text-stone-600"
                    >
                        <FileText className="w-4 h-4" /> Export PDFs
                    </button>
                    <button 
                        onClick={handleResetAllRSVPs} 
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm flex items-center gap-2 text-red-600"
                    >
                        <Trash2 className="w-4 h-4" /> Reset RSVPs
                    </button>
                </div>
            </div>

          </div>
        }
      />

      <div className="flex gap-2">
        {['all', 'confirmed', 'pending', 'declined'].map(f => (
           <button 
             key={f}
             onClick={() => { setFilter(f); setCurrentPage(1); setSelectedIds([]); }}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-[#A67B5B] text-white shadow-sm' : 'bg-white border text-stone-600 hover:bg-stone-50'}`}
           >
             {f.charAt(0).toUpperCase() + f.slice(1)}
           </button>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-[100] flex items-center flex-nowrap overflow-visible no-scrollbar gap-6 border border-stone-800 max-w-[95vw]"
          >
            <div className="flex items-center gap-2 pr-6 border-r border-stone-800 shrink-0">
              <div className="w-6 h-6 rounded-full bg-[#A67B5B] flex items-center justify-center text-[10px] font-bold">
                {selectedIds.length}
              </div>
              <span className="text-sm font-medium whitespace-nowrap">Selected</span>
            </div>
            
            <div className="flex items-center gap-3 overflow-visible no-scrollbar py-1">
              <div className="flex items-center gap-3 border-r border-stone-800 pr-4 shrink-0">
                <select 
                  className="bg-stone-800 text-white text-xs rounded border-stone-700 focus:ring-[#A67B5B] outline-none px-3 py-2 w-36"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkUpdate({ group: e.target.value });
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">Set Group...</option>
                  <option value="family">Family</option>
                  <option value="friends">Friends</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>

                {/* Invite Via — click-toggle submenu */}
                <div className="relative shrink-0">
                    <button 
                        onClick={() => setShowBulkMenu(prev => prev === 'invite' ? null : 'invite')}
                        className="flex items-center gap-2 bg-stone-800 text-white text-xs px-4 py-2 rounded border border-stone-700 hover:bg-stone-700 transition-colors w-36 justify-between"
                    >
                        Invite Via <ChevronDown className={`w-3 h-3 transition-transform ${showBulkMenu === 'invite' ? 'rotate-180' : ''}`} />
                    </button>
                    {showBulkMenu === 'invite' && (
                        <div className="absolute bottom-full left-0 mb-2 w-40 bg-stone-800 border border-stone-700 rounded-lg shadow-xl py-1 z-[110]">
                            <button 
                                onClick={() => { handleBulkWhatsApp(); setShowBulkMenu(null); }}
                                className="w-full text-left px-3 py-2 hover:bg-stone-700 text-xs flex items-center gap-2 text-white"
                            >
                                <MessageCircle className="w-3.5 h-3.5 text-green-500" /> WhatsApp
                            </button>
                            <button 
                                onClick={() => { handleBulkSendInvite(); setShowBulkMenu(null); }}
                                className="w-full text-left px-3 py-2 hover:bg-stone-700 text-xs flex items-center gap-2 text-white"
                                disabled={isBulkExporting}
                            >
                                <Mail className="w-3.5 h-3.5 text-blue-400" /> Email
                            </button>
                        </div>
                    )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                  {/* Export — click-toggle submenu */}
                  <div className="relative shrink-0">
                      <button 
                          onClick={() => setShowBulkMenu(prev => prev === 'export' ? null : 'export')}
                          className="flex items-center gap-2 hover:text-[#A67B5B] transition-colors text-xs px-4 py-2 bg-stone-800 rounded border border-stone-700 w-36 justify-between"
                      >
                          <Download className="w-4 h-4" /> Export <ChevronDown className={`w-3 h-3 transition-transform ${showBulkMenu === 'export' ? 'rotate-180' : ''}`} />
                      </button>
                      {showBulkMenu === 'export' && (
                          <div className="absolute bottom-full left-0 mb-2 w-40 bg-stone-800 border border-stone-700 rounded-lg shadow-xl py-1 z-[110]">
                              <button 
                                  onClick={() => { exportBulk('png'); setShowBulkMenu(null); }}
                                  className="w-full text-left px-3 py-2 hover:bg-stone-700 text-xs flex items-center gap-2 text-white"
                                  disabled={isBulkExporting}
                              >
                                  <FileImage className="w-3.5 h-3.5 text-emerald-400" /> Export PNG
                              </button>
                              <button 
                                  onClick={() => { exportBulk('pdf'); setShowBulkMenu(null); }}
                                  className="w-full text-left px-3 py-2 hover:bg-stone-700 text-xs flex items-center gap-2 text-white"
                                  disabled={isBulkExporting}
                              >
                                  <FileText className="w-3.5 h-3.5 text-blue-400" /> Export PDF
                              </button>
                          </div>
                      )}
                  </div>
                  
                  <button 
                    onClick={() => {
                        if (window.confirm(`Reset RSVP status for ${selectedIds.length} selected guests?`)) {
                            handleBulkUpdate({ rsvp_status: 'pending', confirmed_plus_ones: 0 });
                        }
                    }}
                    className="flex items-center gap-2 hover:text-orange-400 transition-colors text-xs px-4 py-2 bg-stone-800 rounded border border-stone-700 w-36 justify-center"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset RSVP
                  </button>

                  <button 
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 hover:text-red-400 transition-colors text-xs px-4 py-2 bg-stone-800 rounded border border-stone-700 w-36 justify-center"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
              </div>
            </div>
            
            <button 
              onClick={() => { setSelectedIds([]); setShowBulkMenu(null); }}
              className="ml-2 p-1 hover:bg-stone-800 rounded-lg transition-colors border-l border-stone-800 pl-4 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isBulkExporting && (
          <div className="bg-[#A67B5B]/10 border border-[#A67B5B]/20 p-4 rounded-xl flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-[#A67B5B]" />
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

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          {guestsLoading ? (
              <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#A67B5B]" /></div>
          ) : filteredGuests.length === 0 ? (
              <div className="p-12 text-center text-stone-500">No guests found.</div>
          ) : viewMode === 'spreadsheet' ? (
              <div className="overflow-x-auto relative" style={{ maxHeight: '70vh' }}>
                  <table className="w-full text-sm border-collapse border-stone-200">
                      <thead className="sticky top-0 bg-stone-50 z-10 shadow-sm border-b border-stone-200">
                          <tr>
                              <th className="px-2 py-3 w-10 text-center border-r border-stone-200 bg-stone-100">
                                  {/* Empty header for the select checkbox */}
                              </th>
                              <th className="px-2 py-3 text-center font-mono text-stone-500 w-12 border-r border-stone-200 bg-stone-100">#</th>
                              <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">A - Name</th>
                              <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">B - Email</th>
                              <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">C - Phone</th>
                              <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">D - Group</th>
                               <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">E - Invitation Via</th>
                              <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">F - Extra Plus Ones Allowed</th>
                               <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">G - RSVP Code</th>
                              <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100 text-center">H - Invite</th>
                              <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider bg-stone-100">I - RSVP Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                          {pagedGuests.map((guest, index) => (
                              <tr key={guest.id} className={`hover:bg-blue-50/30 group ${selectedIds.includes(guest.id) ? 'bg-blue-50/50' : ''}`}>
                                  <td className="px-2 py-2 text-center border-r border-stone-200">
                                      <input 
                                        type="checkbox" 
                                        className="w-3.5 h-3.5 rounded border-stone-300 text-[#A67B5B] focus:ring-[#A67B5B]"
                                        checked={selectedIds.includes(guest.id)}
                                        onChange={() => toggleSelect(guest.id)}
                                      />
                                  </td>
                                  <td className="px-2 py-2 text-center text-stone-400 bg-stone-50 border-r border-stone-200 select-none">
                                      {index + 1}
                                  </td>
                                  <td className="p-0 border-r border-stone-200 relative">
                                      <div className="relative flex items-center">
                                          <input 
                                            type="text" 
                                            defaultValue={guest.name} 
                                            onBlur={(e) => handleInlineSave(guest, 'name', e.target.value)}
                                            className={`w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all font-medium text-stone-800 ${guest.parent_guest_id ? 'pl-8' : ''}`}
                                            placeholder="Name"
                                          />
                                          {guest.parent_guest_id && (
                                              <div className="absolute left-2 text-purple-400 pointer-events-none" title="Plus One">
                                                  <Users className="w-4 h-4" />
                                              </div>
                                          )}
                                      </div>
                                  </td>
                                  <td className="p-0 border-r border-stone-200 relative">
                                      <input 
                                        type="email" 
                                        defaultValue={guest.email || ''} 
                                        onBlur={(e) => handleInlineSave(guest, 'email', e.target.value)}
                                        className="w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all text-stone-600"
                                        placeholder="Email"
                                      />
                                  </td>
                                  <td className="p-0 border-r border-stone-200 relative">
                                      <input 
                                        type="text" 
                                        defaultValue={guest.phone || ''} 
                                        onBlur={(e) => handleInlineSave(guest, 'phone', e.target.value)}
                                        className="w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all text-stone-600"
                                        placeholder="Phone"
                                      />
                                  </td>
                                  <td className="p-0 border-r border-stone-200 relative">
                                      <input 
                                        type="text" 
                                        defaultValue={guest.group || ''} 
                                        onBlur={(e) => handleInlineSave(guest, 'group', e.target.value)}
                                        className="w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all text-stone-600 capitalize"
                                        placeholder="Group"
                                      />
                                  </td>
                                  <td className="p-0 border-r border-stone-200 relative">
                                      <select 
                                        value={guest.invitation_via || 'whatsapp'} 
                                        onChange={(e) => handleInlineSave(guest, 'invitation_via', e.target.value)}
                                        className="w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all text-stone-600 appearance-none"
                                      >
                                          <option value="whatsapp">WhatsApp</option>
                                          <option value="email">Email</option>
                                      </select>
                                  </td>
                                  <td className="p-0 border-r border-stone-200 relative">
                                      <input 
                                        type="number" 
                                        defaultValue={guest.plus_ones_allowed || 0} 
                                        min="0"
                                        onBlur={(e) => handleInlineSave(guest, 'plus_ones_allowed', e.target.value)}
                                        className="w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all font-mono text-stone-600"
                                      />
                                  </td>
                                  <td className="px-3 py-2 text-stone-600 border-r border-stone-200 font-mono text-xs">
                                      {guest.unique_code || '—'}
                                  </td>
                                  <td className="px-3 py-2 border-r border-stone-200 text-center">
                                      <button 
                                        onClick={() => handleInviteRequest(guest)}
                                        className={`p-1 rounded-md transition-all ${guest.invitation?.status === 'sent' || guest.invitation?.status === 'responded' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-400 hover:bg-[#A67B5B]/10 hover:text-[#A67B5B]'}`}
                                        title="Invite guest"
                                      >
                                          <Send className="w-4 h-4" />
                                      </button>
                                  </td>
                                  <td className="px-3 py-2 text-xs">
                                      <span className={`px-2 py-1 rounded-full flex items-center justify-center gap-1 w-fit whitespace-nowrap
                                          ${guest.rsvp_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                          guest.rsvp_status === 'declined' ? 'bg-red-100 text-red-700' :
                                          'bg-orange-100 text-orange-700'}
                                      `}>
                                          {guest.rsvp_status === 'confirmed' && <Check className="w-2.5 h-2.5" />}
                                          {guest.rsvp_status === 'confirmed' ? 'Confirmed' : 
                                           guest.rsvp_status === 'declined' ? 'Declined' : 'Pending'}
                                      </span>
                                  </td>
                                  <td className="px-3 py-2 text-center border-r border-stone-200">
                                      <button 
                                        onClick={() => {
                                          if (window.confirm(`Reset RSVP status for ${guest.name}?`)) {
                                            handleInlineSave(guest, 'rsvp_status', 'pending');
                                          }
                                        }}
                                        className="p-1 text-stone-400 hover:text-orange-500"
                                        title="Reset RSVP"
                                      >
                                          <RotateCcw className="w-4 h-4" />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                          
                          {/* Extra empty rows for quick adding */}
                          {[...Array(5)].map((_, index) => (
                              <tr key={`empty-${index}`} className="hover:bg-green-50/30 group">
                                  <td className="px-2 py-2 text-center text-stone-300 bg-stone-50 border-r border-stone-200 select-none text-xs italic">
                                      New
                                  </td>
                                  <td className="p-0 border-r border-stone-200 relative">
                                      <input 
                                        type="text" 
                                        onBlur={(e) => {
                                            if (e.target.value.trim()) {
                                                handleInlineCreate(index, 'name', e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                        className="w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all font-medium text-stone-800 placeholder-stone-300"
                                        placeholder="+ Add Name..."
                                      />
                                  </td>
                                  <td className="p-0 border-r border-stone-200 relative">
                                      <input 
                                        type="email" 
                                        onBlur={(e) => {
                                            if (e.target.value.trim()) {
                                                handleInlineCreate(index, 'email', e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                        className="w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all text-stone-600 placeholder-stone-300"
                                        placeholder="Email..."
                                      />
                                  </td>
                                  <td className="p-0 border-r border-stone-200 relative">
                                      <input 
                                        type="text" 
                                        onBlur={(e) => {
                                            if (e.target.value.trim()) {
                                                handleInlineCreate(index, 'phone', e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                        className="w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all text-stone-600 placeholder-stone-300"
                                        placeholder="Phone..."
                                      />
                                  </td>
                                  <td className="p-0 border-r border-stone-200 relative bg-stone-50/50"></td>
                                  <td className="p-0 border-r border-stone-200 relative bg-stone-50/50"></td>
                                  <td className="p-0 border-r border-stone-200 relative bg-stone-50/50"></td>
                                  <td className="px-3 py-2 text-stone-400 border-r border-stone-200 font-mono text-xs bg-stone-50/50"></td>
                                  <td className="px-3 py-2 text-stone-400 border-r border-stone-200 font-mono text-xs bg-stone-50/50"></td>
                                  <td className="px-3 py-2 text-xs bg-stone-50/50"></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          ) : (
              <div className="overflow-x-auto">
                  <table className="w-full">
                      <thead className="bg-stone-50 border-b border-stone-100">
                          <tr>
                              <th className="px-6 py-4 text-left">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded border-stone-300 text-[#A67B5B] focus:ring-[#A67B5B]"
                                  checked={selectedIds.length === filteredGuests.length && filteredGuests.length > 0}
                                  onChange={toggleSelectAll}
                                />
                              </th>
                               <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Name</th>
                               <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Contact</th>
                               <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Group</th>
                               <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Plus Ones</th>
                               <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">RSVP Status</th>
                               <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                          {pagedGuests.map(guest => (
                              <tr key={guest.id} className={`hover:bg-stone-50/50 ${selectedIds.includes(guest.id) ? 'bg-stone-50' : ''}`}>
                                  <td className="px-6 py-4">
                                      <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-stone-300 text-[#A67B5B] focus:ring-[#A67B5B]"
                                        checked={selectedIds.includes(guest.id)}
                                        onChange={() => toggleSelect(guest.id)}
                                      />
                                  </td>
                                  <td className="px-6 py-4">
                                       <div className="flex items-center gap-2">
                                           <div className="font-medium text-stone-800">{guest.name}</div>
                                           {guest.parent_guest_id && (
                                               <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] uppercase font-bold rounded">Plus One</span>
                                           )}
                                       </div>
                                       <div className="text-[10px] font-mono text-stone-400 mt-0.5 uppercase tracking-wider">Code: {guest.unique_code || '—'}</div>
                                       {guest.parent_guest_id && guest.parent_guest && (
                                           <div className="text-[10px] text-stone-400 italic">Guest of: {guest.parent_guest.name}</div>
                                       )}
                                   </td>
                                   <td className="px-6 py-4">
                                       <div className="space-y-1">
                                           {guest.email && (
                                               <div className="flex items-center gap-1.5 text-xs text-stone-500">
                                                   <Mail className="w-2.5 h-2.5 text-stone-400" />
                                                   {guest.email}
                                               </div>
                                           )}
                                           {guest.phone && (
                                               <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
                                                   <MessageCircle className="w-2.5 h-2.5 text-green-500" />
                                                   {guest.phone}
                                               </div>
                                           )}
                                           {!guest.email && !guest.phone && <span className="text-[10px] text-stone-300 italic">No contact info</span>}
                                       </div>
                                   </td>
                                   <td className="px-6 py-4">
                                       <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 capitalize">
                                           {guest.group}
                                       </span>
                                   </td>
                                  <td className="px-6 py-4">
                                      {guest.plus_ones && guest.plus_ones.length > 0 ? (
                                          <div>
                                              <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                                                  +{guest.plus_ones.length}
                                              </span>
                                              <div className="text-xs text-stone-500 mt-1">
                                                  {guest.plus_ones.map(po => po.name).join(', ')}
                                              </div>
                                          </div>
                                      ) : (
                                          <span className="text-xs text-stone-400">None</span>
                                      )}
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex w-fit whitespace-nowrap items-center gap-1 ${
                                          guest.rsvp_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                          guest.rsvp_status === 'declined' ? 'bg-red-100 text-red-700' :
                                          'bg-orange-100 text-orange-700'
                                      }`}>
                                          {guest.rsvp_status === 'confirmed' && <Check className="w-2.5 h-2.5" />}
                                          {guest.rsvp_status === 'confirmed' ? 'Confirmed' : 
                                           guest.rsvp_status === 'declined' ? 'Declined' : 'Pending'}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                          <button 
                                            onClick={() => { setInviteGuest(guest); setIsInviteModalOpen(true); }}
                                            className="p-1 text-stone-400 hover:text-[#A67B5B]"
                                            title="Manage Invitation"
                                          >
                                            <Send className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => handleEdit(guest)} className="p-1 text-stone-400 hover:text-[#A67B5B]"><Edit className="w-4 h-4" /></button>
                                          <button 
                                              onClick={() => {
                                                if (window.confirm(`Reset RSVP status for ${guest.name}?`)) {
                                                  handleUpdateGuest(guest, { rsvp_status: 'pending', confirmed_plus_ones: 0 });
                                                }
                                              }}
                                              className="p-1 text-stone-400 hover:text-orange-500"
                                              title="Reset RSVP"
                                            >
                                              <RotateCcw className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(guest.id)} className="p-1 text-stone-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-100 bg-white px-4 py-3 sm:px-6 rounded-b-2xl">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-stone-700">
                    Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredGuests.length)}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredGuests.length)}</span> of <span className="font-medium">{filteredGuests.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-stone-400 ring-1 ring-inset ring-stone-300 hover:bg-stone-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
                      <span className="sr-only">Previous</span>
                      &larr;
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === i + 1 ? 'z-10 bg-[#A67B5B] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A67B5B]' : 'text-stone-900 ring-1 ring-inset ring-stone-300 hover:bg-stone-50 focus:z-20 focus:outline-offset-0'}`}> {i + 1} </button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-stone-400 ring-1 ring-inset ring-stone-300 hover:bg-stone-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
                      <span className="sr-only">Next</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
      </div>

      <InvitationActionModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        guest={inviteGuest}
        onSendEmail={handleSendInvite}
        onSendWhatsApp={handleWhatsAppInvite}
        onUpdateGuest={handleUpdateGuest}
      />

      <GuestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        guest={selectedGuest}
        onSave={handleSave}
      />
      
      {design && (
          <InvitationExportContainer 
              design={design} 
              guest={exportingGuest} 
              weddingSettings={{
                  wedding_date: contentData?.countdown?.content?.wedding_date || '2026-11-14',
                  venue_name: contentData?.home_hero?.content?.venue?.en || contentData?.home_hero?.content?.venue || 'The Grand Estate'
              }}
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
    </div>
  );
}
