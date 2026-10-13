import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LogOut, Settings, UserCog } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useDismiss from '../../hooks/useDismiss';

const ACCOUNT_LINKS = [
  { path: '/admin/dashboard/users', icon: UserCog, label: 'Users', id: 'header-users' },
  { path: '/admin/dashboard/settings', icon: Settings, label: 'Settings', id: 'header-settings' },
];

/**
 * Avatar menu in the admin header: who is signed in, account-level pages
 * (Users, Settings), sign-out — plus, on small screens, the header's quick
 * links that don't fit in the bar (`compactLinks`).
 */
export default function HeaderAccountMenu({ compactLinks = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const handleLogout = async () => {
    close();
    await logout();
    navigate('/admin');
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'A';
  const itemClass = 'flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-[#FAF7F2] focus:bg-[#FAF7F2] focus:outline-none';

  return (
    <div className="relative" ref={ref}>
      <button
        id="header-account"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user?.name || 'admin'}`}
        className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-black/5 transition-colors"
      >
        <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium bg-[#A67B5B]">
          {initial}
        </span>
        <span className="hidden xl:block max-w-[8rem] truncate text-sm font-medium text-[#4A3F35]">{user?.name || 'Admin'}</span>
        <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-50"
          >
            <div className="px-4 py-2 border-b border-stone-100 mb-1">
              <p className="text-sm font-semibold text-stone-800 truncate">{user?.name || 'Admin'}</p>
              {user?.email && <p className="text-xs text-stone-500 truncate">{user.email}</p>}
            </div>

            {compactLinks.length > 0 && (
              <div className="md:hidden border-b border-stone-100 pb-1 mb-1">
                {compactLinks.map((link) => (
                  <Link key={link.path} to={link.path} role="menuitem" onClick={close} className={itemClass}>
                    <link.icon className="w-4 h-4 text-[#A67B5B]" />
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {ACCOUNT_LINKS.map((link) => (
              <Link key={link.path} id={link.id} to={link.path} role="menuitem" onClick={close} className={itemClass}>
                <link.icon className="w-4 h-4 text-[#A67B5B]" />
                {link.label}
              </Link>
            ))}

            <div className="border-t border-stone-100 mt-1 pt-1">
              <button type="button" role="menuitem" onClick={handleLogout} className={`${itemClass} w-full text-red-600`}>
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
