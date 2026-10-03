import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Calendar, Gift, Mail, Settings, Image,
  ChevronRight, Check, Clock, TrendingUp, PieChart, UserCheck, Music, MessageSquare, HelpCircle, CheckCircle
} from 'lucide-react';

import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminSummaryCards from '../../components/admin/AdminSummaryCards';
import AdminShell from '../../components/admin/AdminShell';
import Spinner from '../../components/admin/Spinner';

import { useAuth } from '../../context/AuthContext';
import { guestService, giftService } from '../../services/api';

// Admin sub-pages are lazy-loaded so each becomes its own chunk, keeping the
// initial admin bundle small instead of shipping every screen at once.
const AdminTestLab = lazy(() => import('./AdminTestLab'));
const SeatingChart = lazy(() => import('./SeatingChart'));
const InvitationDesigner = lazy(() => import('./InvitationDesigner'));
const GalleryManager = lazy(() => import('./GalleryManager'));
const ContentManager = lazy(() => import('./ContentManager'));
const AnalyticsCharts = lazy(() => import('./AnalyticsCharts'));
const CheckInScanner = lazy(() => import('./CheckInScanner'));
const AdminSongRequests = lazy(() => import('./AdminSongRequests'));
const AdminGuestbook = lazy(() => import('./AdminGuestbook'));
const AdminSchedule = lazy(() => import('./AdminSchedule'));
const AdminGifts = lazy(() => import('./AdminGifts'));
const AdminEmails = lazy(() => import('./AdminEmails'));
const AdminSettings = lazy(() => import('./AdminSettings'));
const AdminGuests = lazy(() => import('./AdminGuests'));
const AdminFAQ = lazy(() => import('./AdminFAQ'));
const AdminModules = lazy(() => import('./AdminModules'));
const AdminEnquiries = lazy(() => import('./AdminEnquiries'));
const AdminRSVPs = lazy(() => import('./AdminRSVPs'));

// Dashboard Overview Component
function DashboardOverview() {
  const [stats, setStats] = useState({
    totalGuests: 0,
    confirmed: 0,
    pending: 0,
    giftsReserved: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [, setLoading] = useState(true);

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
      } catch {
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
    <AdminPageLayout
      hero={
        <AdminPageHero
          title="Welcome Back!"
          description="Here's what's happening with your wedding plans today."
          breadcrumb={[{ label: 'Dashboard' }]}
          icon={<LayoutDashboard className="w-5 h-5 text-[#A67B5B]" />}
        />
      }
      summary={<AdminSummaryCards cards={statCards} columns={4} />}
    >
      <div className="grid lg:grid-cols-2 gap-6">
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
          <h2 className="text-lg mb-6 font-semibold text-[#4A3F35]">
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
          <h2 className="text-lg mb-6 font-semibold text-[#4A3F35]">
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
    </AdminPageLayout>
  );
}

// Main Dashboard Layout
export default function AdminDashboard() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

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

  return (
    <AdminShell>
      <Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}>
        <Routes>
          <Route index element={<DashboardOverview />} />
          <Route path="analytics" element={<AnalyticsCharts />} />
          <Route path="checkin" element={<CheckInScanner />} />
          <Route path="guests" element={<AdminGuests />} />
          <Route path="rsvps" element={<AdminRSVPs />} />
          <Route path="seating" element={<SeatingChart />} />
          <Route path="design" element={<InvitationDesigner />} />
          <Route path="gallery" element={<GalleryManager />} />
          <Route path="content" element={<ContentManager />} />
          <Route path="modules" element={<AdminModules />} />
          <Route path="schedule" element={<AdminSchedule />} />
          <Route path="gifts" element={<AdminGifts />} />
          <Route path="emails" element={<AdminEmails />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="songs" element={<AdminSongRequests />} />
          <Route path="guestbook" element={<AdminGuestbook />} />
          <Route path="enquiries" element={<AdminEnquiries />} />
          <Route path="faqs" element={<AdminFAQ />} />
          <Route path="test" element={<AdminTestLab />} />
          {/* Unknown admin sub-paths fall back to the overview, as before */}
          <Route path="*" element={<DashboardOverview />} />
        </Routes>
      </Suspense>
    </AdminShell>
  );
}
