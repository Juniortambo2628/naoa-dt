import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import { lazy, Suspense } from 'react';

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
const DigitalInvitation = lazy(() => import('./pages/DigitalInvitation'));
const Contact = lazy(() => import('./pages/Contact'));

import PublicLayout from './components/PublicLayout';
import Loader from './components/Loader';
import CookieConsent from './components/CookieConsent';
import NotFound from './components/NotFound';
import ModuleDisabled from './components/ModuleDisabled';

// Context
import { AuthProvider } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';

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
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ContentProvider>
          <Router>
          <Toaster position="top-right" />
          <AnimatePresence mode="wait">
            <Suspense fallback={<Loader />}>
              <Routes>
                {/* Public Routes — shared Navbar/Footer via PublicLayout */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/rsvp" element={<RSVP />} />
                  <Route path="/rsvp/:code" element={<RSVP />} />
                  <Route path="/programme" element={<Programme />} />
                  <Route path="/gifts" element={<GiftRegistry />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/songs" element={<SongRequests />} />
                  <Route path="/guestbook" element={<Guestbook />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/contact" element={<Contact />} />
                </Route>

                {/* FAQ has a bespoke full-screen layout; guest invitation is chrome-less */}
                <Route path="/faq" element={<Faq />} />
                <Route path="/invitation/:code" element={<DigitalInvitation />} />

                {/* Admin Routes — AdminDashboard owns its own nested routing */}
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
                {/* Auxiliary Routes */}
                <Route path="/module-unavailable/:module" element={<ModuleDisabled />} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AnimatePresence>
          <CookieConsent />
        </Router>
        </ContentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
