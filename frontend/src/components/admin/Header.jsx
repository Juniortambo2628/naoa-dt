import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Search, FlaskConical, Info, BellRing, UserPlus, Gift, Mail, Calendar, CheckCircle, Settings } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
import { notificationService } from '../../services/api';

const ICON_MAP = {
  bell: BellRing,
  user_plus: UserPlus,
  gift: Gift,
  mail: Mail,
  calendar: Calendar,
  check: CheckCircle,
  settings: Settings,
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const then = new Date(dateStr);
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NotificationIcon({ icon }) {
  const IconComp = ICON_MAP[icon] || BellRing;
  return <IconComp className="w-4 h-4 text-[#A67B5B]" />;
}

export default function Header({ onMenuClick, onRestartTutorial }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { searchQuery, setSearchQuery } = useSearch();
  const fetchedRef = useRef(false);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getRecent();
      const payload = res.data;
      const items = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.read_at).length);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!fetchedRef.current) {
        fetchedRef.current = true;
        try {
          const res = await notificationService.getRecent();
          if (cancelled) return;
          const payload = res.data;
          const items = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
          setNotifications(items);
          setUnreadCount(items.filter(n => !n.read_at).length);
        } catch (e) {
          console.error("Failed to fetch notifications", e);
        }
      }
    };
    init();
    const interval = setInterval(fetchNotifications, 30000);
    return () => { cancelled = true; clearInterval(interval); };
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
                    {notifications.length > 0 ? notifications.map(n => {
                      const title = n.title || 'Notification';
                      const message = n.message || '';
                      return (
                        <div key={n.id} className="px-4 py-3 hover:bg-[#FAF7F2] border-b border-stone-50 last:border-0 cursor-pointer transition-colors" onClick={() => setShowNotifications(false)}>
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 p-1.5 rounded-lg bg-[#A67B5B]/10 shrink-0">
                              <NotificationIcon icon={n.icon} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!n.read_at ? 'font-bold text-stone-900' : 'font-medium text-stone-700'}`}>{title}</p>
                              {message && <p className="text-xs text-stone-500 mt-0.5 truncate">{message}</p>}
                              <p className="text-xs text-stone-400 mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                            {!n.read_at && <span className="w-2 h-2 rounded-full bg-[#A67B5B] shrink-0 mt-1.5" />}
                          </div>
                        </div>
                      );
                    }) : (
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
