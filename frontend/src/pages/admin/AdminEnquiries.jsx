import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, MessageSquare, Trash2, Clock, Loader2, 
  RefreshCw, Send, CheckCircle, ChevronRight, X 
} from 'lucide-react';
import { enquiryService } from '../../services/api';
import AdminPageHero from '../../components/admin/AdminPageHero';
import { useSearch } from '../../context/SearchContext';

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const { searchQuery } = useSearch();

  const fetchEnquiries = async () => {
    try {
      const res = await enquiryService.getAll();
      setEnquiries(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch enquiries', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return;
    
    setProcessing(id);
    try {
      await enquiryService.delete(id);
      fetchEnquiries();
    } catch (err) {
      console.error('Failed to delete enquiry', err);
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
      fetchEnquiries();
    } catch (err) {
      console.error('Failed to send reply', err);
      alert('Failed to send reply. Please try again.');
    }
    setProcessing(null);
  };

  const filteredEnquiries = enquiries.filter(enq => {
    const activeSearch = searchQuery || '';
    const searchLower = activeSearch.toLowerCase();
    
    const matchesSearch = (enq.name || '').toLowerCase().includes(searchLower) || 
           (enq.email || '').toLowerCase().includes(searchLower) ||
           (enq.subject || '').toLowerCase().includes(searchLower) ||
           (enq.message || '').toLowerCase().includes(searchLower);
           
    const matchesType = typeFilter === 'all' || (enq.type || 'guest') === typeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Enquiries"
        description={`${enquiries.length} enquiries received`}
        breadcrumb={[
          { label: 'Dashboard', path: '/admin/dashboard' },
          { label: 'Enquiries' },
        ]}
        icon={<Mail className="w-5 h-5 text-[#A67B5B]" />}
        actions={
          <button 
            onClick={() => { setLoading(true); fetchEnquiries(); }}
            className="p-2 text-stone-500 hover:bg-stone-100 rounded-full transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-stone-100 shadow-sm w-fit">
        <button
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${typeFilter === 'all' ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-500 hover:bg-stone-50'}`}
        >
            All Enquiries
        </button>
        <button
            onClick={() => setTypeFilter('guest')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${typeFilter === 'guest' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-stone-500 hover:bg-stone-50'}`}
        >
            Guests
        </button>
        <button
            onClick={() => setTypeFilter('vendor')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${typeFilter === 'vendor' ? 'bg-purple-50 text-purple-600 shadow-sm' : 'text-stone-500 hover:bg-stone-50'}`}
        >
            Vendors
        </button>
        <button
            onClick={() => setTypeFilter('other')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${typeFilter === 'other' ? 'bg-stone-100 text-stone-600 shadow-sm' : 'text-stone-500 hover:bg-stone-50'}`}
        >
            Other
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading && enquiries.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#A67B5B]" />
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="text-center py-12 text-stone-500 bg-white rounded-2xl border border-stone-100">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>{searchQuery ? 'No matching enquiries found' : 'No enquiries yet'}</p>
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
                    <span className="font-bold text-stone-800">{enq.name}</span>
                    <span className="text-sm text-stone-500 font-medium">{enq.email}</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                      enq.type === 'vendor' ? 'bg-purple-50 text-purple-600' :
                      enq.type === 'guest' ? 'bg-blue-50 text-blue-600' :
                      'bg-stone-100 text-stone-600'
                    }`}>
                      {enq.type || 'guest'}
                    </span>
                    {enq.status === 'replied' ? (
                      <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                        <CheckCircle className="w-3 h-3" /> Replied
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-[#A67B5B]/10 text-[#A67B5B] text-xs font-bold rounded-full uppercase tracking-wider">
                        Pending
                      </span>
                    )}
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
                  <button
                    onClick={() => handleDelete(enq.id)}
                    disabled={processing === enq.id}
                    className="p-2.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Enquiry"
                  >
                    {processing === enq.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {showReplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <div>
                  <h2 className="text-xl font-bold text-stone-800">Reply to Enquiry</h2>
                  <p className="text-xs text-stone-500">To: {selectedEnquiry.name} ({selectedEnquiry.email})</p>
                </div>
                <button onClick={() => setShowReplyModal(false)} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleReply} className="p-6 space-y-4">
                <div className="bg-stone-50 p-4 rounded-xl mb-4 max-h-32 overflow-y-auto border border-stone-100">
                    <p className="text-xs font-bold text-stone-400 uppercase mb-1">Original Message</p>
                    <p className="text-stone-600 text-sm italic">"{selectedEnquiry.message}"</p>
                </div>

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
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Send Reply
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
