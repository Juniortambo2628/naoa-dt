import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Clock, 
  Send, CheckCircle, X, RefreshCw, Trash2
} from 'lucide-react';
import { useEnquiries } from '../../hooks/useApiHooks';
import { enquiryService } from '../../services/api';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminToolbar from '../../components/admin/AdminToolbar';
import AdminBulkActions from '../../components/admin/AdminBulkActions';
import AdminFloatingToolbar from '../../components/admin/AdminFloatingToolbar';
import AdminModal from '../../components/admin/AdminModal';
import EmptyState from '../../components/admin/EmptyState';
import Spinner from '../../components/admin/Spinner';
import DeleteButton from '../../components/admin/DeleteButton';
import { useSearch } from '../../context/SearchContext';
import useFilteredItems from '../../hooks/useFilteredItems';

export default function AdminEnquiries() {
  const { data, isLoading: loading, refetch } = useEnquiries();
  const enquiries = data?.data || [];
  const [processing, setProcessing] = useState(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [selectedIds, setSelectedIds] = useState([]);
  const { searchQuery, setSearchQuery } = useSearch();

  const filteredEnquiries = useFilteredItems(enquiries, searchQuery, (enq, searchLower) => {
    const matchesSearch = (enq.name || '').toLowerCase().includes(searchLower) || 
           (enq.email || '').toLowerCase().includes(searchLower) ||
           (enq.subject || '').toLowerCase().includes(searchLower) ||
           (enq.message || '').toLowerCase().includes(searchLower);
    const matchesType = typeFilter === 'all' || (enq.type || 'guest') === typeFilter;
    return matchesSearch && matchesType;
  });

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredEnquiries.map((enq) => enq.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return;
    
    setProcessing(id);
    try {
      await enquiryService.delete(id);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      refetch();
    } catch (err) {
      console.error('Failed to delete enquiry', err);
    }
    setProcessing(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected enquiries?`)) return;

    setProcessing('bulk');
    try {
      await Promise.all(selectedIds.map((id) => enquiryService.delete(id)));
      refetch();
      clearSelection();
    } catch (err) {
      console.error('Failed to delete selected enquiries', err);
    }
    setProcessing(null);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setProcessing(selectedEnquiry.id);
    try {
      await enquiryService.reply(selectedEnquiry.id, replyMessage);
      setShowReplyModal(false);
      setReplyMessage('');
      refetch();
    } catch (err) {
      console.error('Failed to send reply', err);
      alert('Failed to send reply. Please try again.');
    }
    setProcessing(null);
  };

  const bulkActions = [
    {
      id: 'delete',
      label: 'Delete Selected',
      icon: Trash2,
      variant: 'danger',
      onClick: handleBulkDelete,
      disabled: processing === 'bulk',
    },
  ];

  const TypeBadge = ({ type }) => (
    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
      type === 'vendor' ? 'bg-purple-50 text-purple-600' :
      type === 'guest' ? 'bg-blue-50 text-blue-600' :
      'bg-stone-100 text-stone-600'
    }`}>
      {type || 'guest'}
    </span>
  );

  const StatusBadge = ({ status }) =>
    status === 'replied' ? (
      <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
        <CheckCircle className="w-3 h-3" /> Replied
      </span>
    ) : (
      <span className="px-3 py-1 bg-[#A67B5B]/10 text-[#A67B5B] text-xs font-bold rounded-full uppercase tracking-wider">
        Pending
      </span>
    );

  return (
    <>
      <AdminPageLayout
        hero={
          <AdminPageHero
            title="Enquiries"
            description={`${enquiries.length} enquiries received`}
            breadcrumb="Enquiries"
            icon={<Mail className="w-5 h-5 text-[#A67B5B]" />}
          />
        }
        toolbar={
          <AdminToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search enquiries..."
            filters={[
              { id: 'all', label: 'All Enquiries' },
              { id: 'guest', label: 'Guests' },
              { id: 'vendor', label: 'Vendors' },
              { id: 'other', label: 'Other' },
            ]}
            activeFilter={typeFilter}
            onFilterChange={setTypeFilter}
            viewMode={viewMode}
            viewOptions={['list', 'grid']}
            onViewModeChange={setViewMode}
          />
        }
      >
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <AdminBulkActions
              selectedCount={selectedIds.length}
              onClearSelection={clearSelection}
              actions={bulkActions}
            />
          )}
        </AnimatePresence>

        {filteredEnquiries.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-stone-500">
              {filteredEnquiries.length} enquiry{filteredEnquiries.length === 1 ? '' : 'ies'}
            </span>
            <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filteredEnquiries.every((enq) => selectedIds.includes(enq.id))}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-[#A67B5B] cursor-pointer"
              />
              Select all
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {loading && enquiries.length === 0 ? (
            <EmptyState loading />
          ) : filteredEnquiries.length === 0 ? (
            <EmptyState icon={Mail} message="No enquiries yet" searchQuery={searchQuery} />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEnquiries.map((enq) => (
                <motion.div
                  key={enq.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => toggleSelection(enq.id)}
                  className={`bg-white p-5 rounded-2xl border shadow-sm cursor-pointer transition-all ${
                    selectedIds.includes(enq.id)
                      ? 'border-[#A67B5B]/50 ring-1 ring-[#A67B5B]/20'
                      : 'border-stone-100 hover:border-stone-200'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(enq.id)}
                      onChange={() => toggleSelection(enq.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 w-4 h-4 accent-[#A67B5B] cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-stone-800 truncate">{enq.name}</p>
                      <p className="text-sm text-stone-500 truncate">{enq.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <TypeBadge type={enq.type} />
                    <StatusBadge status={enq.status} />
                  </div>

                  <h3 className="font-bold text-stone-800 mb-2 truncate">{enq.subject || 'No Subject'}</h3>
                  <p className="text-stone-600 text-sm bg-stone-50 p-3 rounded-xl italic line-clamp-3 mb-4">
                    "{enq.message}"
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                    <span className="text-xs text-stone-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(enq.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      {enq.status !== 'replied' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEnquiry(enq);
                            setShowReplyModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#A67B5B] text-white text-xs font-bold rounded-lg hover:bg-[#8B5E3C] transition-all shadow-sm active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" /> Reply
                        </button>
                      )}
                      <span onClick={(e) => e.stopPropagation()}>
                        <DeleteButton
                          onClick={() => handleDelete(enq.id)}
                          processing={processing === enq.id}
                          title="Delete Enquiry"
                        />
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEnquiries.map((enq) => (
                <motion.div
                  key={enq.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`bg-white p-6 rounded-2xl border ${enq.status === 'replied' ? 'border-stone-100' : 'border-[#A67B5B]/30 shadow-sm'} flex flex-col md:flex-row gap-6`}
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(enq.id)}
                        onChange={() => toggleSelection(enq.id)}
                        className="w-4 h-4 accent-[#A67B5B] cursor-pointer"
                      />
                      <span className="font-bold text-stone-800">{enq.name}</span>
                      <span className="text-sm text-stone-500 font-medium">{enq.email}</span>
                      <TypeBadge type={enq.type} />
                      <StatusBadge status={enq.status} />
                      <span className="text-xs text-stone-400 flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" /> {new Date(enq.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-stone-800 mb-2">{enq.subject || 'No Subject'}</h3>
                    <p className="text-stone-600 bg-stone-50 p-4 rounded-xl italic">"{enq.message}"</p>
                    
                    {enq.reply_message && (
                      <div className="mt-4 pl-4 border-l-4 border-green-100">
                        <p className="text-xs font-bold text-green-600 uppercase mb-1">Your Reply</p>
                        <p className="text-stone-500 text-sm">{enq.reply_message}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row md:flex-col items-center gap-3 md:border-l md:border-stone-100 md:pl-6 min-w-[120px]">
                    {enq.status !== 'replied' && (
                      <button
                        onClick={() => { setSelectedEnquiry(enq); setShowReplyModal(true); }}
                        className="flex-1 md:w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#A67B5B] text-white text-sm font-bold rounded-xl hover:bg-[#8B5E3C] transition-all shadow-sm active:scale-95"
                      >
                        <Send className="w-4 h-4" /> Reply
                      </button>
                    )}
                    <DeleteButton
                      onClick={() => handleDelete(enq.id)}
                      processing={processing === enq.id}
                      title="Delete Enquiry"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Reply Modal */}
        <AdminModal isOpen={showReplyModal} onClose={() => setShowReplyModal(false)} title="Reply to Enquiry" size="lg">
          {selectedEnquiry && (
            <>
              <p className="text-xs text-stone-500 mb-4">To: {selectedEnquiry.name} ({selectedEnquiry.email})</p>
              <div className="bg-stone-50 p-4 rounded-xl mb-4 max-h-32 overflow-y-auto border border-stone-100">
                  <p className="text-xs font-bold text-stone-400 uppercase mb-1">Original Message</p>
                  <p className="text-stone-600 text-sm italic">"{selectedEnquiry.message}"</p>
              </div>
              
              <form onSubmit={handleReply} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Your Response</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Type your reply here..."
                    className="w-full px-4 py-3 rounded-2xl border-2 border-stone-100 focus:border-[#A67B5B] focus:ring-0 transition-all outline-none bg-stone-50/30 resize-none"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                  />
                  <p className="text-[10px] text-stone-400 mt-2 italic">
                    This message will be sent directly to the enquirer's email address.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReplyModal(false)}
                    className="flex-1 py-3 border-2 border-stone-100 text-stone-500 font-bold rounded-2xl hover:bg-stone-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing === selectedEnquiry.id || !replyMessage.trim()}
                    className="flex-[2] py-3 bg-[#A67B5B] text-white font-bold rounded-2xl hover:bg-[#8B5E3C] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processing === selectedEnquiry.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Send Reply
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </AdminModal>
      </AdminPageLayout>
      <AdminFloatingToolbar
        actions={[
          {
            id: 'refresh',
            label: 'Refresh',
            icon: RefreshCw,
            onClick: () => refetch(),
            disabled: loading,
          },
        ]}
      />
    </>
  );
}
