import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, FlaskConical, Info, BellRing, UserPlus, Gift, Mail, Calendar, CheckCircle, Settings, PieChart, UserCheck, History, Share2 } from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import CollaboratorAvatars from './CollaboratorAvatars';
import HeaderAccountMenu from './HeaderAccountMenu';
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

// Operational pages reachable from the header (they used to crowd the sidebar).
const QUICK_LINKS = [
  { path: '/admin/dashboard/analytics', icon: PieChart, label: 'Analytics', id: 'header-analytics' },
  { path: '/admin/dashboard/checkin', icon: UserCheck, label: 'Check-In', id: 'header-checkin' },
  { path: '/admin/dashboard/emails', icon: Mail, label: 'Email Templates', id: 'header-emails' },
  { path: '/admin/dashboard/test', icon: FlaskConical, label: 'Test Lab', id: 'header-test' },
];

function NotificationIcon({ icon }) {
  const IconComp = ICON_MAP[icon] || BellRing;
  return <IconComp className="w-4 h-4 text-[#A67B5B]" />;
}

export default function Header({ onMenuClick, onRestartTutorial, titleSlotRef, statusSlotRef }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const fetchedRef = useRef(false);
  const { presence, othersHere, openHistory, setShareOpen, badges } = useCollaboration();
  const hasNews = Object.values(badges).some(Boolean);

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
      id="header"
      className="sticky top-0 z-30 h-16 px-3 sm:px-6 flex items-center justify-between gap-3"
      style={{ 
        background: 'rgba(255, 249, 245, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(166, 123, 91, 0.1)',
      }}
    >
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <button
          onClick={onMenuClick}
          aria-label={hasNews ? 'Open sidebar menu (new changes)' : 'Open sidebar menu'}
          className="lg:hidden relative p-2 rounded-lg hover:bg-black/5 shrink-0"
        >
          <Menu className="w-6 h-6 text-[#4A3F35]" />
          {hasNews && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#A67B5B] ring-2 ring-[#FFF9F5]" aria-hidden="true" />}
        </button>
        {/* Compact page title, filled by AdminPageHero once it scrolls away */}
        <div ref={titleSlotRef} className="min-w-0 flex-1" />
        {/* Someone else is on this page: say so, to avoid overwriting each other */}
        {othersHere.length > 0 && (
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="hidden sm:flex items-center gap-2 shrink-0 pl-1 pr-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-800"
            title="Others editing here may overwrite each other's unsaved changes"
          >
            <CollaboratorAvatars people={othersHere} size="xs" max={2} />
            <span className="max-w-[14rem] truncate">
              {othersHere.length === 1 ? `${othersHere[0].name} is here too` : `${othersHere.length} others are here too`}
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Page status (e.g. the designer's save indicator) */}
        <div ref={statusSlotRef} className="flex items-center empty:hidden mr-1" />

        <nav aria-label="Quick links" className="hidden md:flex items-center gap-1 pr-2 mr-1 border-r border-stone-200/70">
          {QUICK_LINKS.map((link) => {
            const active = pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                id={link.id}
                to={link.path}
                title={link.label}
                aria-label={link.label}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 p-2 2xl:px-3 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-[#A67B5B] text-white' : 'text-[#6B5D52] hover:bg-[#A67B5B]/10 hover:text-[#A67B5B]'
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span className="hidden 2xl:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Who's online (click for the share panel) */}
        {presence.length > 0 && (
          <button type="button" onClick={() => setShareOpen(true)} className="hidden md:flex p-1 rounded-full hover:bg-black/5"
            aria-label={`${presence.length} collaborator${presence.length === 1 ? '' : 's'} online`}>
            <CollaboratorAvatars people={presence} max={3} />
          </button>
        )}

        <button
          id="header-share"
          type="button"
          onClick={() => setShareOpen(true)}
          aria-label="Share dashboard"
          title="Share — invite collaborators"
          className="flex items-center gap-2 p-2 xl:px-3 rounded-xl text-sm font-medium text-[#6B5D52] hover:bg-[#A67B5B]/10 hover:text-[#A67B5B] transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span className="hidden xl:inline">Share</span>
        </button>

        <button
          id="header-history"
          type="button"
          onClick={openHistory}
          aria-label="Version history"
          title="Version history"
          className="p-2 rounded-xl text-[#6B5D52] hover:bg-[#A67B5B]/10 hover:text-[#A67B5B] transition-colors"
        >
          <History className="w-5 h-5" />
        </button>

        <button aria-label="Restart Dashboard Tour"
          id="header-restart"
          onClick={onRestartTutorial}
          className="hidden sm:block p-2 rounded-xl text-[#8B7B6B] hover:bg-black/5 transition-colors"
          title="Restart Dashboard Tour"
        >
          <Info className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            aria-haspopup="true"
            aria-expanded={showNotifications}
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
                        <button
                          type="button"
                          key={n.id}
                          className="w-full text-left px-4 py-3 hover:bg-[#FAF7F2] focus:bg-[#FAF7F2] focus:outline-none border-b border-stone-50 last:border-0 transition-colors"
                          onClick={() => { setShowNotifications(false); if (n.link) navigate(n.link); }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 p-1.5 rounded-lg bg-[#A67B5B]/10 shrink-0">
                              <NotificationIcon icon={n.icon} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!n.read_at ? 'font-bold text-stone-900' : 'font-medium text-stone-700'}`}>{title}</p>
                              {message && <p className="text-xs text-stone-600 mt-0.5 truncate">{message}</p>}
                              <p className="text-xs text-stone-500 mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                            {!n.read_at && <span className="w-2 h-2 rounded-full bg-[#A67B5B] shrink-0 mt-1.5" aria-label="Unread" />}
                          </div>
                        </button>
                      );
                    }) : (
                      <div className="px-4 py-8 text-center text-xs text-stone-400 italic">No notifications yet</div>
                    )}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <HeaderAccountMenu compactLinks={QUICK_LINKS} />
      </div>
    </header>
  );
}
