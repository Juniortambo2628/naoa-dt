import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import { useState, useEffect, lazy, Suspense } from 'react';

// Lazy load Pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const RSVP = lazy(() => import('./pages/RSVP'));
const Programme = lazy(() => import('./pages/Programme'));
const GiftRegistry = lazy(() => import('./pages/GiftRegistry'));
const Gallery = lazy(() => import('./pages/Gallery'));
const SongRequests = lazy(() => import('./pages/SongRequests'));
const Guestbook = lazy(() => import('./pages/Guestbook'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Faq = lazy(() => import('./pages/Faq'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

import Loader from './components/Loader';
import CookieConsent from './components/CookieConsent';

// Context
import { AuthProvider } from './context/AuthContext';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});


 
function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading for the "Wow" factor
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (initialLoading) {
    return <Loader />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" />
          <AnimatePresence mode="wait">
            <Suspense fallback={<Loader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/rsvp" element={<RSVP />} />
                <Route path="/rsvp/:code" element={<RSVP />} />
                <Route path="/programme" element={<Programme />} />
                <Route path="/gifts" element={<GiftRegistry />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/songs" element={<SongRequests />} />
                <Route path="/guestbook" element={<Guestbook />} />
                <Route path="/faq" element={<Faq />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
              </Routes>
            </Suspense>
          </AnimatePresence>
          <CookieConsent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
