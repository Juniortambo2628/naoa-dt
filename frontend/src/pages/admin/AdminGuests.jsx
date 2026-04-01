import { useState, useEffect, useRef } from 'react';
import { Users, Search, Filter, Plus, Edit, Trash2, Check, Download, Loader2, Mail, Send, FileImage, FileText, Package, List, Grid, Upload, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { guestService, invitationService, settingService } from '../../services/api';
import GuestModal from '../../components/admin/GuestModal';
import ImportConflictModal from '../../components/admin/ImportConflictModal';
import InvitationExportContainer from '../../components/admin/InvitationExportContainer';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminToolbar from '../../components/admin/AdminToolbar';
import { useGuests, useSettings } from '../../hooks/useApiHooks';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function AdminGuests() {
  const { data: guestsData, isLoading: guestsLoading, refetch: refetchGuests } = useGuests();
  const { data: settingsData, isLoading: settingsLoading } = useSettings();

  const [guests, setGuests] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, confirmed, pending, declined
  const [sendingId, setSendingId] = useState(null);
  const [design, setDesign] = useState(null);
  const [exportingGuest, setExportingGuest] = useState(null);
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const exporterRef = useRef(null);
  
  // Spreadsheet View States
  const [viewMode, setViewMode] = useState('list');
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState(null); // { conflicts: [], valid: [], skipped_count: 0 }
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const fileInputRef = useRef(null);
  
  // Hover/Menu Persistence States
  const [showBulkMenu, setShowBulkMenu] = useState(false);
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

  const handleWhatsAppInvite = async (guest) => {
    if (!guest.phone) {
      alert("This guest has no phone number.");
      return;
    }

    const cleanPhone = guest.phone.replace(/[^0-9]/g, '');
    const message = `Hi ${guest.name}! We'd love for you to join us at our wedding. View your invitation and RSVP here: ${window.location.origin}/rsvp?code=${guest.unique_code}`;
    const whatsappUrl = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(message)}`;

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');

    // Mark as sent in the background
    try {
      await guestService.markWhatsappInvite(guest.id);
      // Refresh guest to show new status
      refetchGuests();
    } catch (err) {
      console.error("Failed to mark WhatsApp invite as sent", err);
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
    if (selectedGuest) {
        await guestService.update(selectedGuest.id, data);
    } else {
        await guestService.create(data);
    }
    refetchGuests();
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

  const handleSendInvite = async (guest) => {
    if (!guest.email) {
        alert('Guest has no email address.');
        return;
    }
    if (!window.confirm(`Send invitation to ${guest.name}?`)) return;

    setSendingId(guest.id);
    try {
        await invitationService.send(guest.id);
        alert('Invitation sent successfully!');
        refetchGuests(); // Refresh to show status if we tracked it
    } catch (e) {
        console.error(e);
        alert('Failed to send invitation.');
    }
    setSendingId(null);
  };

  // Filter and Search logic
  const filteredGuests = guests.filter(guest => {
      const matchesSearch = guest.name.toLowerCase().includes(search.toLowerCase()) || 
                            (guest.email && guest.email.toLowerCase().includes(search.toLowerCase()));
      const matchesFilter = filter === 'all' ? true : guest.rsvp_status === filter;
      return matchesSearch && matchesFilter;
  });

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
          <>
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
            <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isImporting}
                className="btn-secondary flex items-center gap-2"
            >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Import Excel
            </button>

            <div 
                className="relative"
                onMouseEnter={handleMouseEnterBulk}
                onMouseLeave={handleMouseLeaveBulk}
            >
                <button className="btn-secondary flex items-center gap-2">
                    <Download className="w-4 h-4" /> Bulk Export
                </button>
                
                <AnimatePresence>
                    {showBulkMenu && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 top-full mt-1 bg-white shadow-xl border border-stone-100 rounded-xl py-2 w-48 z-50"
                        >
                            <div className="absolute -top-2 left-0 right-0 h-4 bg-transparent" />
                            <button 
                                onClick={() => { exportBulk('png'); setShowBulkMenu(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-2"
                                disabled={isBulkExporting}
                            >
                                <FileImage className="w-4 h-4" /> PNG Images (.zip)
                            </button>
                            <button 
                                onClick={() => { exportBulk('pdf'); setShowBulkMenu(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-2"
                                disabled={isBulkExporting}
                            >
                                <FileText className="w-4 h-4" /> PDF Documents (.zip)
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Guest
            </button>
          </>
        }
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search guests..."
        filters={[
          { id: 'all', label: 'All Guests' },
          { id: 'confirmed', label: 'Confirmed' },
          { id: 'pending', label: 'Pending' },
          { id: 'declined', label: 'Declined' },
        ]}
        activeFilter={filter}
        onFilterChange={(id) => { setFilter(id); setSelectedIds([]); }}
      />

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-6 border border-stone-800"
          >
            <div className="flex items-center gap-2 pr-6 border-r border-stone-800">
              <div className="w-6 h-6 rounded-full bg-[#A67B5B] flex items-center justify-center text-[10px] font-bold">
                {selectedIds.length}
              </div>
              <span className="text-sm font-medium">Selected</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 border-r border-stone-800 pr-4">
                <select 
                  className="bg-stone-800 text-white text-xs rounded border-stone-700 focus:ring-[#A67B5B] outline-none px-2 py-1"
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

                <select 
                  className="bg-stone-800 text-white text-xs rounded border-stone-700 focus:ring-[#A67B5B] outline-none px-2 py-1"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkUpdate({ invitation_via: e.target.value });
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">Set Invite Via...</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <button 
                onClick={() => exportBulk('pdf')}
                className="flex items-center gap-2 hover:text-[#A67B5B] transition-colors text-sm"
              >
                <Download className="w-4 h-4" /> Export PDF
              </button>
              <button 
                onClick={handleBulkWhatsApp}
                className="flex items-center gap-2 hover:text-[#A67B5B] transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4" /> Invite WhatsApp
              </button>
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 hover:text-red-400 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
            
            <button 
              onClick={() => setSelectedIds([])}
              className="ml-4 p-1 hover:bg-stone-800 rounded-lg transition-colors border-l border-stone-800 pl-4"
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
                              <th className="px-2 py-3 text-center font-mono text-stone-500 w-12 border-r border-stone-200 bg-stone-100">#</th>
                              <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">A - Name</th>
                              <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">B - Email</th>
                              <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">C - Group</th>
                               <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">D - Invitation Via</th>
                              <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">E - Extra Plus Ones Allowed</th>
                               <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">F - RSVP Code</th>
                              <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100 text-center">G - WhatsApp</th>
                              <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider bg-stone-100">H - RSVP Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                          {filteredGuests.map((guest, index) => (
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
                                        onClick={() => handleWhatsAppInvite(guest)}
                                        className={`p-1 rounded-md transition-colors ${guest.invitation?.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-400 hover:bg-green-50 hover:text-green-600'}`}
                                        title="Send WhatsApp Invite"
                                      >
                                          <MessageCircle className="w-4 h-4" />
                                      </button>
                                  </td>
                                  <td className="px-3 py-2 text-xs">
                                      <span className={`px-2 py-1 rounded w-fit flex items-center gap-1
                                          ${guest.rsvp_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                          guest.rsvp_status === 'declined' ? 'bg-red-100 text-red-700' :
                                          'bg-orange-100 text-orange-700'}
                                      `}>
                                          {guest.rsvp_status === 'confirmed' && <Check className="w-3 h-3" />}
                                          {guest.rsvp_status === 'confirmed' ? 'Confirmed' : 
                                           guest.rsvp_status === 'declined' ? 'Declined' : 'Pending'}
                                      </span>
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
                                  <td className="p-0 border-r border-stone-200 relative bg-stone-50/50"></td>
                                  <td className="p-0 border-r border-stone-200 relative bg-stone-50/50"></td>
                                  <td className="p-0 border-r border-stone-200 relative bg-stone-50/50"></td>
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
                              <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">RSVP Code</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Group</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Invite via</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Plus Ones</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">RSVP Status</th>
                              <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                          {filteredGuests.map(guest => (
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
                                      {guest.email && <div className="text-xs text-stone-500">{guest.email}</div>}
                                      {guest.parent_guest_id && guest.parent_guest && (
                                          <div className="text-[10px] text-stone-400 italic">Guest of: {guest.parent_guest.name}</div>
                                      )}
                                  </td>
                                  <td className="px-6 py-4">
                                      <code className="px-2 py-1 rounded bg-stone-100 text-stone-700 text-xs font-mono">
                                          {guest.unique_code || '—'}
                                      </code>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600 capitalize">
                                          {guest.group}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className="text-xs text-stone-500 capitalize px-2 py-0.5 bg-stone-100 rounded">
                                          {guest.invitation_via || 'whatsapp'}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4">
                                      {guest.plus_ones && guest.plus_ones.length > 0 ? (
                                          <div>
                                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
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
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex w-fit items-center gap-1 ${
                                          guest.rsvp_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                          guest.rsvp_status === 'declined' ? 'bg-red-100 text-red-700' :
                                          'bg-orange-100 text-orange-700'
                                      }`}>
                                          {guest.rsvp_status === 'confirmed' && <Check className="w-3 h-3" />}
                                          {guest.rsvp_status === 'confirmed' ? 'Confirmed' : 
                                           guest.rsvp_status === 'declined' ? 'Declined' : 'Pending RSVP'}
                                      </span>
                                       {guest.invitation?.status === 'sent' && (
                                           <div className="text-[10px] text-stone-400 mt-1 flex flex-col gap-0.5">
                                               <div className="flex items-center gap-1">
                                                   <Mail className="w-3 h-3" /> Email Sent
                                               </div>
                                               <div className="flex items-center gap-1 text-green-600">
                                                   <MessageCircle className="w-3 h-3" /> WhatsApp Sent
                                               </div>
                                           </div>
                                       )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                          <div 
                                            className="relative"
                                            onMouseEnter={() => handleMouseEnterGuest(guest.id)}
                                            onMouseLeave={handleMouseLeaveGuest}
                                          >
                                              <button 
                                                className="p-1 text-stone-400 hover:text-green-600"
                                                title="Send WhatsApp Invite"
                                                onClick={() => handleWhatsAppInvite(guest)}
                                              >
                                                <MessageCircle className="w-4 h-4" />
                                              </button>
                                              
                                              <button 
                                                className="p-1 text-stone-400 hover:text-[#A67B5B]"
                                                title="Download Invite"
                                              >
                                                <Download className="w-4 h-4" />
                                              </button>
                                              
                                              <AnimatePresence>
                                                  {hoveredGuestId === guest.id && (
                                                      <motion.div 
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="absolute right-0 bottom-full mb-1 bg-white shadow-xl border border-stone-100 rounded-lg py-1 w-32 z-50"
                                                      >
                                                          <div className="absolute -bottom-2 left-0 right-0 h-4 bg-transparent" /> {/* Invisible bridge */}
                                                          <button 
                                                            onClick={() => { exportSingle(guest, 'png'); setHoveredGuestId(null); }}
                                                            className="w-full text-left px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50 flex items-center gap-2"
                                                          >
                                                              <FileImage className="w-3 h-3" /> PNG
                                                          </button>
                                                          <button 
                                                            onClick={() => { exportSingle(guest, 'pdf'); setHoveredGuestId(null); }}
                                                            className="w-full text-left px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50 flex items-center gap-2"
                                                          >
                                                              <FileText className="w-3 h-3" /> PDF
                                                          </button>
                                                      </motion.div>
                                                  )}
                                              </AnimatePresence>
                                          </div>
                                          <button 
                                            onClick={() => handleSendInvite(guest)}
                                            disabled={!guest.email || sendingId === guest.id}
                                            className={`p-1 hover:text-[#A67B5B] ${guest.email ? 'text-stone-400' : 'text-stone-200 cursor-not-allowed'}`}
                                            title="Send Invite"
                                          >
                                            {sendingId === guest.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                          </button>
                                          <button onClick={() => handleEdit(guest)} className="p-1 text-stone-400 hover:text-[#A67B5B]"><Edit className="w-4 h-4" /></button>
                                          <button onClick={() => handleDelete(guest.id)} className="p-1 text-stone-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}
      </div>

      <GuestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} guest={selectedGuest} allGuests={guests} />
      
      {design && (
          <InvitationExportContainer 
              design={design} 
              guest={exportingGuest} 
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
