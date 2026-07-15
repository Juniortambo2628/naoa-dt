import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Calendar, Gift, Mail, Settings, Image,
  LogOut, X, Edit, PieChart, UserCheck, Music, MessageSquare, FlaskConical, HelpCircle, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', id: 'sidebar-dashboard' },
  { path: '/admin/dashboard/analytics', icon: PieChart, label: 'Analytics', id: 'sidebar-analytics' },
  { path: '/admin/dashboard/guests', icon: Users, label: 'Guests', id: 'sidebar-guests' },
  { path: '/admin/dashboard/rsvps', icon: CheckCircle, label: 'RSVPs & Messages', id: 'sidebar-rsvps' },
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

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

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
        className={`admin-sidebar fixed left-0 top-0 h-full z-50 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform lg:transition-none`}
        style={{ 
          width: 280,
          background: 'linear-gradient(180deg, #4A3F35 0%, #5C4F42 100%)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 flex items-center justify-center relative">
            <Link to="/" className="flex items-center justify-center">
              <img 
                src="/Naoa-logo.png" 
                alt="Logo" 
                className="h-14 w-auto rounded-xl"
                style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}
              />
            </Link>
            <button 
              onClick={onClose}
              className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6B5D4F #4A3F35' }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
              
              return (
                <Link
                  key={item.path}
                  id={item.id}
                  to={item.path}
                  onClick={() => onClose()}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                    isActive 
                      ? 'text-[#A67B5B] bg-white shadow-sm' 
                      : 'text-white/60 hover:text-[#A67B5B] hover:bg-white'
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium truncate">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: '#A67B5B' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="p-3 border-t border-white/10">
            <div 
              className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
              style={{ 
                background: 'rgba(255, 249, 245, 0.85)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                style={{ background: '#A67B5B' }}
              >
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: '#4A3F35' }}>{user?.name || 'Admin'}</p>
                <p className="text-xs truncate" style={{ color: '#8B7D6B' }}>{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
