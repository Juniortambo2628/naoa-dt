import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SearchProvider } from '../../context/SearchContext';
import Sidebar from './Sidebar';
import Header from './Header';
import AdminTutorial from './AdminTutorial';

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
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </SearchProvider>
  );
}
