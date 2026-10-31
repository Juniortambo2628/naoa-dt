import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Calendar, Gift, Image, X, Music, MessageSquare, HelpCircle,
  MailCheck, Armchair, Palette, FileText, Blocks, Inbox, BellRing,
} from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import { moduleForPath } from '../../utils/adminModules';
import CollaboratorAvatars from './CollaboratorAvatars';

// Content pages, grouped. Analytics, Check-In, Email Templates and Test Lab
// live in the header's quick links; Users, Settings, Backups and sign-out in
// its account menu.
const navSections = [
  {
    items: [{ path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', id: 'sidebar-dashboard' }],
  },
  {
    title: 'Guests',
    items: [
      { path: '/admin/dashboard/guests', icon: Users, label: 'Guests', id: 'sidebar-guests' },
      { path: '/admin/dashboard/rsvps', icon: MailCheck, label: 'RSVPs & Messages', id: 'sidebar-rsvps' },
      { path: '/admin/dashboard/seating', icon: Armchair, label: 'Seating Chart', id: 'sidebar-seating' },
      { path: '/admin/dashboard/design', icon: Palette, label: 'Design Invitations', id: 'sidebar-design' },
    ],
  },
  {
    title: 'Website',
    items: [
      { path: '/admin/dashboard/content', icon: FileText, label: 'CMS', id: 'sidebar-content' },
      { path: '/admin/dashboard/modules', icon: Blocks, label: 'Modules', id: 'sidebar-modules' },
      { path: '/admin/dashboard/gallery', icon: Image, label: 'Gallery', id: 'sidebar-gallery' },
      { path: '/admin/dashboard/schedule', icon: Calendar, label: 'Schedule', id: 'sidebar-schedule' },
      { path: '/admin/dashboard/faqs', icon: HelpCircle, label: 'FAQs', id: 'sidebar-faqs' },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { path: '/admin/dashboard/songs', icon: Music, label: 'Song Requests', id: 'sidebar-songs' },
      { path: '/admin/dashboard/guestbook', icon: MessageSquare, label: 'Write to Us', id: 'sidebar-guestbook' },
      { path: '/admin/dashboard/enquiries', icon: Inbox, label: 'Enquiries', id: 'sidebar-enquiries' },
      { path: '/admin/dashboard/gifts', icon: Gift, label: 'Gifts', id: 'sidebar-gifts' },
      { path: '/admin/dashboard/announcements', icon: BellRing, label: 'Announcements', id: 'sidebar-announcements' },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  // "New" badges: changes by others since you last opened a module; avatars:
  // who else is on that page right now.
  const { badges, presence } = useCollaboration();

  return (
    <>
      {/* Mobile Overlay — overlay and drawer sit above the page's floating toolbar (z-50) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[55] lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`admin-sidebar fixed left-0 top-0 h-full z-[60] lg:z-50 lg:translate-x-0 ${
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
              aria-label="Close menu"
              onClick={onClose}
              className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav aria-label="Main" className="flex-1 py-2 px-3 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6B5D4F #4A3F35' }}>
            {navSections.map((section, sectionIndex) => (
              <div key={section.title || sectionIndex} className={sectionIndex > 0 ? 'mt-4' : ''}>
                {section.title && (
                  <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">{section.title}</p>
                )}
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path ||
                      (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
                    const moduleKey = moduleForPath(item.path)?.key;
                    const newCount = isActive ? 0 : badges[moduleKey] || 0;
                    const here = presence.filter(p => p.current_module === moduleKey);
                    const label = [item.label, newCount && `${newCount} new`, here.length && `${here.map(p => p.name).join(', ')} here`]
                      .filter(Boolean).join(', ');
                    return (
                      <li key={item.path}>
                        <Link
                          id={item.id}
                          to={item.path}
                          onClick={() => onClose()}
                          aria-current={isActive ? 'page' : undefined}
                          aria-label={label !== item.label ? label : undefined}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm focus-visible:outline-2 focus-visible:outline-white ${
                            isActive
                              ? 'text-[#8B5E3C] bg-white shadow-sm'
                              : 'text-white/75 hover:text-[#8B5E3C] hover:bg-white'
                          }`}
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                          <span className="font-medium truncate">{item.label}</span>
                          {(here.length > 0 || newCount > 0) && (
                            <span className="ml-auto flex items-center gap-1.5 shrink-0" aria-hidden="true">
                              <CollaboratorAvatars people={here} size="xs" max={2} />
                              {newCount > 0 && (
                                <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#E8C9A8] text-[#4A3F35] text-[10px] font-bold flex items-center justify-center">
                                  {newCount > 99 ? '99+' : newCount}
                                </span>
                              )}
                            </span>
                          )}
                          {isActive && (
                            <motion.div
                              layoutId="sidebar-indicator"
                              className={`${here.length ? '' : 'ml-auto'} w-1.5 h-1.5 rounded-full flex-shrink-0`}
                              style={{ background: '#A67B5B' }}
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

        </div>
      </motion.aside>
    </>
  );
}
