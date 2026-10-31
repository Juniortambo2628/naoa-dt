import { useEffect, useMemo, lazy, Suspense } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  LayoutDashboard, Users, Gift, ChevronRight, Clock, PieChart, UserCheck, CheckCircle, CalendarHeart, MapPin,
} from 'lucide-react';

import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminSummaryCards from '../../components/admin/AdminSummaryCards';
import AdminShell from '../../components/admin/AdminShell';
import AdminCard from '../../components/admin/AdminCard';
import EmptyState from '../../components/admin/EmptyState';
import QueryError from '../../components/admin/QueryError';
import RsvpProgressBar from '../../components/admin/RsvpProgressBar';
import Spinner from '../../components/admin/Spinner';

import { useAuth } from '../../context/AuthContext';
import { useGuests, useGuestDuplicates, useGiftStats, useSettings, useContent } from '../../hooks/useApiHooks';
import { guestStats, guestTodos } from '../../utils/guests';
import { RSVP_STATUSES, rsvpStatus, percent, guestListLink } from '../../utils/rsvp';
import { getWeddingInfo } from '../../utils/weddingInfo';

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
const AdminUsers = lazy(() => import('./AdminUsers'));
const AdminModules = lazy(() => import('./AdminModules'));
const AdminEnquiries = lazy(() => import('./AdminEnquiries'));
const AdminRSVPs = lazy(() => import('./AdminRSVPs'));
const AdminBackups = lazy(() => import('./AdminBackups'));
const AdminAnnouncements = lazy(() => import('./AdminAnnouncements'));

// Days (and hours on the day) until the wedding.
function countdownTo(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
  const target = new Date(y, m - 1, d);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((target - today) / 86400000);
  return { days, date: target };
}

// Dashboard Overview — what needs doing, from live data only.
function DashboardOverview() {
  const navigate = useNavigate();
  const { data: guestsData, isLoading, isError, error, refetch } = useGuests();
  const { data: duplicateData } = useGuestDuplicates();
  const { data: giftStats } = useGiftStats();
  const { data: settings } = useSettings();
  const { data: content } = useContent();

  const guests = useMemo(() => {
    const list = guestsData?.data || guestsData;
    return Array.isArray(list) ? list : [];
  }, [guestsData]);
  const stats = useMemo(() => guestStats(guests), [guests]);
  const todos = useMemo(() => guestTodos(guests, { duplicateCount: duplicateData?.duplicate_count || 0 }), [guests, duplicateData]);
  const recent = useMemo(() => guests
    .filter((g) => g.rsvp_status && g.rsvp_status !== 'pending')
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 6), [guests]);

  const info = getWeddingInfo(settings || {}, content || {});
  const countdown = countdownTo(info.wedding_date);
  const loading = isLoading && !guestsData;
  const value = (n) => (loading || isError ? '—' : n);

  const statCards = [
    { label: 'Invited', value: value(stats.total), icon: Users, color: '#A67B5B', hint: `${stats.plusOnes} plus-ones`, onClick: () => navigate(guestListLink({ status: 'all' })) },
    { label: 'Confirmed', value: value(stats.confirmed), icon: UserCheck, color: RSVP_STATUSES.confirmed.color, hint: 'Expected headcount', onClick: () => navigate(guestListLink({ status: 'confirmed' })) },
    { label: 'Awaiting reply', value: value(stats.pending), icon: Clock, color: RSVP_STATUSES.pending.color, hint: `${percent(stats.responded, stats.total)} have replied`, onClick: () => navigate(guestListLink({ status: 'pending' })) },
    { label: 'Gifts reserved', value: giftStats ? giftStats.claimed_gifts ?? 0 : '—', icon: Gift, color: '#C8A68E', hint: giftStats?.total_gifts ? `of ${giftStats.total_gifts} gifts` : 'Registry', onClick: () => navigate('/admin/dashboard/gifts') },
  ];

  return (
    <AdminPageLayout
      actions={[
        { id: 'guests', readOnly: true, label: 'Guest List', icon: Users, variant: 'secondary', onClick: () => navigate('/admin/dashboard/guests') },
        { id: 'analytics', readOnly: true, label: 'Analytics', icon: PieChart, onClick: () => navigate('/admin/dashboard/analytics') },
        { id: 'checkin', readOnly: true, label: 'Check-In', icon: CheckCircle, onClick: () => navigate('/admin/dashboard/checkin') },
      ]}
      hero={
        <AdminPageHero
          title="Welcome Back!"
          description={info.couple_names ? `Planning ${info.couple_names}'s wedding` : "Here's what's happening with your wedding plans today."}
          breadcrumb={[{ label: 'Dashboard' }]}
          icon={<LayoutDashboard className="w-5 h-5 text-[#A67B5B]" />}
        />
      }
      summary={<AdminSummaryCards cards={statCards} columns={4} />}
    >
      {isError && <QueryError what="your guest list" error={error} onRetry={refetch} />}

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Countdown */}
        <AdminCard className="flex flex-col justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#A67B5B]">
            <CalendarHeart className="w-4 h-4" /> The big day
          </div>
          {countdown ? (
            <div className="my-4">
              <p className="text-5xl font-semibold text-[#4A3F35]">
                {countdown.days > 0 ? countdown.days : countdown.days === 0 ? 'Today' : 'Married!'}
              </p>
              {countdown.days > 0 && <p className="text-stone-600">{countdown.days === 1 ? 'day to go' : 'days to go'}</p>}
            </div>
          ) : (
            <p className="my-4 text-stone-600">Set the wedding date in Settings to see the countdown.</p>
          )}
          <div className="text-sm text-stone-600">
            {countdown && <p>{countdown.date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>}
            <p className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {info.venue_name}</p>
          </div>
        </AdminCard>

        {/* RSVP progress */}
        <AdminCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#4A3F35]">RSVP progress</h2>
            <span className="text-sm text-stone-600">{value(stats.responded)} of {value(stats.total)} replied</span>
          </div>
          {loading ? <EmptyState loading rows={1} /> : <RsvpProgressBar stats={stats} />}
        </AdminCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* To-do */}
        <AdminCard>
          <h2 className="text-lg font-semibold text-[#4A3F35] mb-4">To do</h2>
          {loading ? (
            <EmptyState loading rows={3} />
          ) : todos.length === 0 ? (
            <div className="py-8 text-center text-stone-600">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-600" aria-hidden="true" />
              All caught up — nothing needs your attention.
            </div>
          ) : (
            <ul className="space-y-2">
              {todos.map((todo) => (
                <li key={todo.id}>
                  <Link to={todo.to} className="flex items-center gap-4 p-3 rounded-xl border border-stone-100 hover:border-[#A67B5B]/40 hover:bg-[#FAF7F2] transition-colors">
                    <span className="min-w-10 h-10 px-2 rounded-xl bg-[#A67B5B]/10 text-[#8B5E3C] font-bold flex items-center justify-center">{todo.count}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-stone-800">{todo.count} {todo.label}</span>
                      <span className="block text-sm text-stone-600">{todo.hint}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-400" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        {/* Recent RSVPs */}
        <AdminCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#4A3F35]">Recent RSVPs</h2>
            <Link to="/admin/dashboard/rsvps" className="text-sm text-[#A67B5B] hover:underline">See all</Link>
          </div>
          {loading ? (
            <EmptyState loading rows={4} />
          ) : recent.length === 0 ? (
            <p className="text-center py-8 text-stone-600">No RSVPs yet</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((guest) => {
                const status = rsvpStatus(guest.rsvp_status);
                return (
                  <li key={guest.id}>
                    <Link to={`${guestListLink({ status: 'all' })}&q=${encodeURIComponent(guest.name)}`} className="flex items-center gap-3 rounded-xl p-1 hover:bg-[#FAF7F2]">
                      <span className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium bg-gradient-to-br from-[#A67B5B] to-[#C8A68E]" aria-hidden="true">
                        {guest.name?.charAt(0) || 'G'}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium text-[#4A3F35] truncate">{guest.name}</span>
                        <span className="block text-xs text-stone-600">{guest.updated_at ? formatDistanceToNow(new Date(guest.updated_at), { addSuffix: true }) : ''}</span>
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${status.badge}`}>{status.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>
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
          <Route path="users" element={<AdminUsers />} />
          <Route path="backups" element={<AdminBackups />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="test" element={<AdminTestLab />} />
          {/* Unknown admin sub-paths fall back to the overview, as before */}
          <Route path="*" element={<DashboardOverview />} />
        </Routes>
      </Suspense>
    </AdminShell>
  );
}
