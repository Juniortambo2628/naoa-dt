import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { SearchProvider, useSearch } from '../../context/SearchContext';
import { AdminChromeProvider } from '../../context/AdminChromeContext';
import { CollaborationProvider, useCollaboration } from '../../context/CollaborationContext';
import Sidebar from './Sidebar';
import Header from './Header';
import AdminTutorial from './AdminTutorial';
import ConfirmHost from './ConfirmHost';
import ShareModal from './ShareModal';
import VersionHistoryDrawer from './VersionHistoryDrawer';

// Each page starts with an empty search so a query typed on one list never
// silently filters the next page.
function ResetSearchOnNavigate({ pathname }) {
  const { setSearchQuery } = useSearch();
  useEffect(() => { setSearchQuery(''); }, [pathname, setSearchQuery]);
  return null;
}

// Share and Version history are opened from the header, rendered once here.
function CollaborationPanels() {
  const { shareOpen, setShareOpen, historyOpen, closeHistory, module, notifyDataRestored } = useCollaboration();
  return (
    <>
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />
      <AnimatePresence>
        {historyOpen && <VersionHistoryDrawer module={module} onClose={closeHistory} onRestored={notifyDataRestored} />}
      </AnimatePresence>
    </>
  );
}

// Remounts the page after a version is restored, so pages that keep their
// own copy of the data (not just React Query) reload it too.
function PageContent({ pathname, children }) {
  const { dataVersion } = useCollaboration();
  return (
    <motion.div
      key={`${pathname}#${dataVersion}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * AdminShell — the single-source-of-truth layout shell for all admin pages.
 * Provides Sidebar + Header + content area.
 *
 * @param {ReactNode} children - Page content to render in the main area
 */
export default function AdminShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [restartTutorial, setRestartTutorial] = useState(false);
  const location = useLocation();
  // Header slots pages portal into (compact title, status) — see AdminChromeContext.
  const [titleSlot, setTitleSlot] = useState(null);
  const [statusSlot, setStatusSlot] = useState(null);

  // Admin-only accessibility styles (contrast, focus rings, reduced motion) —
  // on <html> so portalled toolbars, menus and dialogs get them too.
  useEffect(() => {
    document.documentElement.classList.add('admin-theme');
    return () => document.documentElement.classList.remove('admin-theme');
  }, []);

  return (
    <MotionConfig reducedMotion="user">
    <SearchProvider>
    <AdminChromeProvider value={{ titleSlot, statusSlot }}>
    <CollaborationProvider>
      <ResetSearchOnNavigate pathname={location.pathname} />
      <div 
        className="min-h-screen"
        style={{ background: 'linear-gradient(180deg, #FFF9F5 0%, #F8E8E0 100%)' }}
      >
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="lg:ml-[280px]">
          <Header 
            onMenuClick={() => setSidebarOpen(true)} 
            onRestartTutorial={() => setRestartTutorial(prev => !prev)}
            titleSlotRef={setTitleSlot}
            statusSlotRef={setStatusSlot}
          />
          
          <ConfirmHost />
          <CollaborationPanels />

          <AdminTutorial 
            key={restartTutorial ? 'restarted' : 'initial'} 
            isRestarted={restartTutorial}
            onComplete={() => setRestartTutorial(false)}
          />
         
          <main className="p-4 sm:p-6">
            <PageContent pathname={location.pathname}>{children}</PageContent>
          </main>
        </div>
      </div>
    </CollaborationProvider>
    </AdminChromeProvider>
    </SearchProvider>
    </MotionConfig>
  );
}
