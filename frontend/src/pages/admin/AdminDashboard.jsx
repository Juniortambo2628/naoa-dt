
import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminTestLab from './AdminTestLab';
import {
  LayoutDashboard, Users, Calendar, Gift, Mail, Settings, Image,
  Menu, Bell, LogOut, ChevronDown, ChevronRight, Search, Filter, X, Plus, Edit, Trash2,
  Check, Clock, TrendingUp, Download, PieChart, BarChart, Heart, UserCheck, Music, MessageSquare, FlaskConical, Info, HelpCircle
} from 'lucide-react';

import AdminTutorial from '../../components/admin/AdminTutorial';
import AdminPageHero from '../../components/admin/AdminPageHero';
/* Force refresh: 2026-04-15 07:02 - Syntax fix complete. Component should now reload. */

import { useAuth } from '../../context/AuthContext';
import { SearchProvider, useSearch } from '../../context/SearchContext';
import { guestService, giftService, scheduleService, settingService, notificationService } from '../../services/api';
import GuestModal from '../../components/admin/GuestModal';
import SeatingChart from './SeatingChart';
import InvitationDesigner from './InvitationDesigner';
import GalleryManager from './GalleryManager';
import ContentManager from './ContentManager';
import AnalyticsCharts from './AnalyticsCharts';
import CheckInScanner from './CheckInScanner';
import AdminSongRequests from './AdminSongRequests';
import AdminGuestbook from './AdminGuestbook';
import AdminSchedule from './AdminSchedule';
import AdminGifts from './AdminGifts';
import AdminEmails from './AdminEmails';
import AdminSettings from './AdminSettings';
import AdminGuests from './AdminGuests';
import AdminFAQ from './AdminFAQ';
import AdminModules from './AdminModules';
import AdminEnquiries from './AdminEnquiries';

// Sidebar Component
function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', id: 'sidebar-dashboard' },
    { path: '/admin/dashboard/analytics', icon: PieChart, label: 'Analytics', id: 'sidebar-analytics' },
    { path: '/admin/dashboard/guests', icon: Users, label: 'Guests', id: 'sidebar-guests' },
    { path: '/admin/dashboard/checkin', icon: UserCheck, label: 'Check-In', id: 'sidebar-checkin' },
    { path: '/admin/dashboard/seating', icon: Users, label: 'Seating Chart', id: 'sidebar-seating' },
    { path: '/admin/dashboard/design', icon: Mail, label: 'Design Invitations', id: 'sidebar-design' },
    { path: '/admin/dashboard/gallery', icon: Image, label: 'Gallery', id: 'sidebar-gallery' },
    { path: '/admin/dashboard/modules', icon: LayoutDashboard, label: 'Modules', id: 'sidebar-modules' },
    { path: '/admin/dashboard/content', icon: Edit, label: 'CMS', id: 'sidebar-content' },
    { path: '/admin/dashboard/schedule', icon: Calendar, label: 'Schedule', id: 'sidebar-schedule' },
    { path: '/admin/dashboard/songs', icon: Music, label: 'Song Requests', id: 'sidebar-songs' },
    { path: '/admin/dashboard/guestbook', icon: MessageSquare, label: 'Write to Us', id: 'sidebar-guestbook' },
    { path: '/admin/dashboard/enquiries', icon: Mail, label: 'Enquiries', id: 'sidebar-enquiries' },
    { path: '/admin/dashboard/faqs', icon: HelpCircle, label: 'FAQs', id: 'sidebar-faqs' },
    { path: '/admin/dashboard/gifts', icon: Gift, label: 'Gifts', id: 'sidebar-gifts' },
    { path: '/admin/dashboard/emails', icon: Mail, label: 'Email Templates', id: 'sidebar-emails' },
    { path: '/admin/dashboard/test', icon: FlaskConical, label: 'Test Lab', id: 'sidebar-test' },
    { path: '/admin/dashboard/settings', icon: Settings, label: 'Settings', id: 'sidebar-settings' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed left-0 top-0 h-full z-50 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform lg:transition-none`}
        style={{ 
          width: 280,
          background: 'linear-gradient(180deg, #4A3F35 0%, #5C4F42 100%)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <Link to="/" className="flex items-center gap-3">
              <span className="text-xl font-semibold text-white">
                D&T Admin
              </span>
            </Link>
            <button 
              onClick={onClose}
              className="lg:hidden absolute right-4 top-6 text-white/60 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
              
              return (
                <Link
                  key={item.path}
                  id={item.id}
                  to={item.path}
                  onClick={() => onClose()}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'text-white' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, rgba(166, 123, 91, 0.3) 0%, rgba(166, 123, 91, 0.1) 100%)',
                  } : {}}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="ml-auto w-2 h-2 rounded-full"
                      style={{ background: '#C8A68E' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                style={{ background: 'rgba(166, 123, 91, 0.5)' }}
              >
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{user?.name || 'Admin'}</p>
                <p className="text-white/50 text-xs">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

// Header Component
function Header({ onMenuClick, onRestartTutorial }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { searchQuery, setSearchQuery } = useSearch();

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getRecent();
      const items = res.data || [];
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.read_at).length);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for "real-time" feel without WebSockets
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

        {/* Restart Tutorial Button */}
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
                        <p className={`text-sm ${!n.read_at ? 'text-stone-900 font-bold' : 'text-stone-700 font-medium'}`}>{n.data.message}</p>
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

// Dashboard Overview Component
function DashboardOverview() {
  const [stats, setStats] = useState({
    totalGuests: 0,
    confirmed: 0,
    pending: 0,
    giftsReserved: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [guestStats, giftStats] = await Promise.all([
          guestService.getStats(),
          giftService.getStats(),
        ]);
        
        setStats({
          totalGuests: guestStats.data?.total || 0,
          confirmed: guestStats.data?.attending || 0,
          pending: guestStats.data?.pending || 0,
          giftsReserved: giftStats.data?.claimed_gifts || 0,
        });
        
        setRecentActivity(guestStats.data?.recent || []);
      } catch (err) {
        // Use demo data
        setStats({ totalGuests: 150, confirmed: 98, pending: 52, giftsReserved: 24 });
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Guests', value: stats.totalGuests, icon: Users, color: '#A67B5B' },
    { label: 'Confirmed', value: stats.confirmed, icon: UserCheck, color: '#8B9A7D' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: '#D4A59A' },
    { label: 'Gifts Reserved', value: stats.giftsReserved, icon: Gift, color: '#C8A68E' },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHero
        title="Welcome Back!"
        description="Here's what's happening with your wedding plans today."
        breadcrumb={[{ label: 'Dashboard' }]}
        icon={<LayoutDashboard className="w-5 h-5 text-[#A67B5B]" />}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 rounded-2xl"
            style={{ 
              background: 'white',
              boxShadow: '0 4px 20px rgba(166, 123, 91, 0.08)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}15` }}
              >
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
              <TrendingUp className="w-5 h-5" style={{ color: '#8B9A7D' }} />
            </div>
            <p 
              className="text-3xl font-semibold mb-1 text-[#4A3F35]"
            >
              {stat.value}
            </p>
            <p className="text-sm text-[#8B7B6B]">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl"
          style={{ 
            background: 'white',
            boxShadow: '0 4px 20px rgba(166, 123, 91, 0.08)',
          }}
        >
          <h2 
            className="text-lg mb-6 font-semibold text-[#4A3F35]"
          >
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Add Guest', icon: Users, path: '/admin/dashboard/guests' },
              { label: 'Send Invites', icon: Mail, path: '/admin/dashboard/emails' },
              { label: 'Add Gift', icon: Gift, path: '/admin/dashboard/gifts' },
              { label: 'Update Schedule', icon: Calendar, path: '/admin/dashboard/schedule' },
            ].map((action) => (
              <Link
                key={action.label}
                to={action.path}
                className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02]"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(166, 123, 91, 0.08) 0%, rgba(166, 123, 91, 0.02) 100%)',
                  border: '1px solid rgba(166, 123, 91, 0.1)',
                }}
              >
                <action.icon className="w-5 h-5 text-[#A67B5B]" />
                <span className="text-[#4A3F35]">{action.label}</span>
                <ChevronRight className="w-4 h-4 ml-auto text-[#8B7B6B]" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl"
          style={{ 
            background: 'white',
            boxShadow: '0 4px 20px rgba(166, 123, 91, 0.08)',
          }}
        >
          <h2 
            className="text-lg mb-6 font-semibold text-[#4A3F35]"
          >
            Recent RSVPs
          </h2>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ background: 'linear-gradient(135deg, #A67B5B 0%, #C8A68E 100%)' }}
                  >
                    {activity.name?.charAt(0) || 'G'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#4A3F35]">
                      {activity.name}
                    </p>
                    <p className="text-sm text-[#8B7B6B]">
                      {activity.attending ? 'Confirmed attendance' : 'Declined invitation'}
                    </p>
                  </div>
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      background: activity.attending ? 'rgba(139, 154, 125, 0.15)' : 'rgba(212, 165, 154, 0.2)',
                      color: activity.attending ? '#8B9A7D' : '#A67B5B',
                    }}
                  >
                    {activity.attending ? 'Attending' : 'Declined'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-[#8B7B6B]">
                No recent RSVPs yet
              </p>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
           className="p-6 rounded-2xl"
           style={{ background: 'white', boxShadow: '0 4px 20px rgba(166, 123, 91, 0.08)' }}
        >
           <h3 className="text-lg font-semibold mb-4 text-[#4A3F35]">Guest Status</h3>
           <div className="flex items-center justify-center gap-4 h-48">
              {/* Simple CSS Chart Placeholder */}
              <div className="flex items-end gap-4 h-32">
                <div className="w-12 bg-green-200 rounded-t-lg relative group" style={{ height: `${stats.totalGuests ? (stats.confirmed / stats.totalGuests) * 100 : 0}%` }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs">{stats.confirmed}</div>
                  <div className="absolute bottom-0 w-full text-center text-xs pb-1">Yes</div>
                </div>
                <div className="w-12 bg-red-200 rounded-t-lg relative group" style={{ height: `${stats.totalGuests ? ((stats.totalGuests - stats.confirmed - stats.pending) / stats.totalGuests) * 100 : 0}%` }}>
                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs">{stats.totalGuests - stats.confirmed - stats.pending}</div>
                   <div className="absolute bottom-0 w-full text-center text-xs pb-1">No</div>
                </div>
                <div className="w-12 bg-orange-200 rounded-t-lg relative group" style={{ height: `${stats.totalGuests ? (stats.pending / stats.totalGuests) * 100 : 0}%` }}>
                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs">{stats.pending}</div>
                   <div className="absolute bottom-0 w-full text-center text-xs pb-1">?</div>
                </div>
              </div>
           </div>
        </motion.div>
      </div>
    </div>
  );
}



// Main Dashboard Layout
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [restartTutorial, setRestartTutorial] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #FFF9F5 0%, #F8E8E0 100%)' }}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 mx-auto mb-4 rounded-full border-4"
            style={{ borderColor: '#A67B5B', borderTopColor: 'transparent' }}
          />
          <p className="text-[#6B5D52]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Determine which component to render based on path
  const getContent = () => {
    const path = location.pathname;
    if (path === '/admin/dashboard') return <DashboardOverview />;
    if (path.includes('/analytics')) return <AnalyticsCharts />;
    if (path.includes('/checkin')) return <CheckInScanner />;
    if (path.includes('/guests')) return <AdminGuests />;
    if (path.includes('/seating')) return <SeatingChart />;
    if (path.includes('/design')) return <InvitationDesigner />;
    if (path.includes('/gallery')) return <GalleryManager />;
    if (path.includes('/content')) return <ContentManager />;
    if (path.includes('/modules')) return <AdminModules />;
    if (path.includes('/schedule')) return <AdminSchedule />;
    if (path.includes('/gifts')) return <AdminGifts />;
    if (path.includes('/emails')) return <AdminEmails />;
    if (path.includes('/settings')) return <AdminSettings />;
    if (path.includes('/songs')) return <AdminSongRequests />;
    if (path.includes('/guestbook')) return <AdminGuestbook />;
    if (path.includes('/enquiries')) return <AdminEnquiries />;
    if (path.includes('/faqs')) return <AdminFAQ />;
    if (path.includes('/test')) return <AdminTestLab />;
    return <DashboardOverview />;
  };

  return (
    <SearchProvider>
      <div 
        className="min-h-screen"
        style={{ background: 'linear-gradient(180deg, #FFF9F5 0%, #F8E8E0 100%)' }}
      >
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="lg:ml-[280px]">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          onRestartTutorial={() => setRestartTutorial(prev => !prev)}
        />
        
        <AdminTutorial 
          key={restartTutorial ? 'restarted' : 'initial'} 
          isRestarted={restartTutorial}
          onComplete={() => setRestartTutorial(false)}
        />
       
        <main className="p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {getContent()}
          </motion.div>
        </main>
      </div>
    </div>
    </SearchProvider>
  );
}
