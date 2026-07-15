import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Search, FlaskConical, Info } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
import { notificationService } from '../../services/api';

export default function Header({ onMenuClick, onRestartTutorial }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { searchQuery, setSearchQuery } = useSearch();

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getRecent();
      // Support both ApiResponse wrapper ({ data: [...] }) and raw array
      const payload = res.data;
      const items = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.read_at).length);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      fetchNotifications();
    } catch (e) {
      console.error("Failed to mark read", e);
    }
  };

  return (
    <header 
      className="sticky top-0 z-30 h-16 px-6 flex items-center justify-between"
      style={{ 
        background: 'rgba(255, 249, 245, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(166, 123, 91, 0.1)',
      }}
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-black/5"
        >
          <Menu className="w-6 h-6 text-[#4A3F35]" />
        </button>
        
        <div className="relative hidden md:block">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7B6B]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search globally..."
            className="w-64 pl-10 pr-4 py-2 rounded-xl border-2 bg-white focus:outline-none transition-all focus:ring-2 focus:ring-[#A67B5B]/50"
            style={{ borderColor: '#E8D4C8' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link 
          to="/admin/dashboard/test" 
          className="p-2 rounded-xl text-[#A67B5B] bg-[#A67B5B]/10 hover:bg-[#A67B5B]/20 transition-colors"
          title="Open Test Lab"
        >
          <FlaskConical className="w-5 h-5" />
        </Link>

        <button
          id="header-restart"
          onClick={onRestartTutorial}
          className="p-2 rounded-xl text-[#8B7B6B] hover:bg-black/5 transition-colors"
          title="Restart Dashboard Tour"
        >
          <Info className="w-5 h-5" />
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl hover:bg-black/5"
          >
            <Bell className="w-5 h-5 text-[#6B5D52]" />
            <span 
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ background: '#A67B5B', display: unreadCount > 0 ? 'block' : 'none' }}
            />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-50 overflow-hidden"
              >
                 <div className="px-4 py-2 border-b border-stone-50 flex justify-between items-center">
                    <span className="text-stone-800 font-medium">Notifications</span>
                    <button onClick={handleMarkAllRead} className="text-xs text-[#A67B5B] hover:text-[#8B5E3C]">Mark all read</button>
                 </div>
                 <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className="px-4 py-3 hover:bg-[#FAF7F2] border-b border-stone-50 last:border-0 cursor-pointer transition-colors" onClick={() => setShowNotifications(false)}>
                        <p className={`text-sm ${!n.read_at ? 'text-stone-900 font-bold' : 'text-stone-700 font-medium'}`}>{n.data?.message}</p>
                        <p className="text-xs text-stone-400 mt-1">{n.created_at}</p>
                      </div>
                    )) : (
                      <div className="px-4 py-8 text-center text-xs text-stone-400 italic">No notifications yet</div>
                    )}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
