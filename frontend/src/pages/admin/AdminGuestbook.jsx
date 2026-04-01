import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, Clock, Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { guestbookService } from '../../services/api';
import AdminPageHero from '../../components/admin/AdminPageHero';

export default function AdminGuestbook() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchEntries = async () => {
    try {
      const res = await guestbookService.getAll();
      setEntries(res.data.entries || []);
    } catch (err) {
      console.error('Failed to fetch guestbook', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    
    setProcessing(id);
    try {
      await guestbookService.delete(id);
      fetchEntries();
    } catch (err) {
      console.error('Failed to delete entry', err);
    }
    setProcessing(null);
  };

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Guestbook Messages"
        description="View and manage messages from your guests"
        breadcrumb={[
          { label: 'Dashboard', path: '/admin/dashboard' },
          { label: 'Guestbook' },
        ]}
        icon={<MessageSquare className="w-5 h-5 text-[#A67B5B]" />}
        actions={
          <button 
            onClick={() => { setLoading(true); fetchEntries(); }}
            className="p-2 text-stone-500 hover:bg-stone-100 rounded-full transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4">
        {loading && entries.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#A67B5B]" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-stone-500 bg-white rounded-2xl border border-stone-100">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No messages yet</p>
          </div>
        ) : (
          <AnimatePresence>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-[#A67B5B]">{entry.guest_name}</span>
                    <span className="text-xs text-stone-400 flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> {entry.time_ago}
                    </span>
                  </div>
                  <p className="text-stone-600 italic">"{entry.message}"</p>
                </div>

                <div className="flex items-center gap-2 md:border-l md:border-stone-100 md:pl-4">
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={processing === entry.id}
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Message"
                  >
                    {processing === entry.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
