import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, UserCheck, Clock, BarChart2 } from 'lucide-react';
import { useAnalytics } from '../../hooks/useApiHooks';
import AdminCard from '../../components/admin/AdminCard';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminSummaryCards from '../../components/admin/AdminSummaryCards';
import EmptyState from '../../components/admin/EmptyState';

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function AnalyticsCharts() {
    const { data, isLoading } = useAnalytics();

    if (isLoading) {
        return <EmptyState loading />;
    }

    if (!data) {
        return <EmptyState icon={BarChart2} message="No analytics data available" />;
    }

    const { rsvpStatus, groups, summary, timeline } = data;

    const statCards = [
        { label: 'Total Invited', value: summary.totalGuests, icon: Users, color: '#A67B5B' },
        { label: 'Confirmed', value: summary.totalConfirmed, icon: UserCheck, color: '#8B9A7D' },
        { label: 'Pending', value: summary.pendingResponses, icon: Clock, color: '#D4A59A' },
    ];

    return (
        <AdminPageLayout
            hero={
                <AdminPageHero
                    title="Analytics & Reports"
                    description="Overview of RSVP responses, guest statistics, and more."
                    breadcrumb="Analytics"
                    icon={<BarChart2 className="w-5 h-5 text-[#A67B5B]" />}
                />
            }
            summary={<AdminSummaryCards cards={statCards} columns={3} />}
        >

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* RSVP Status Pie Chart */}
                <AdminCard>
                    <h3 className="text-lg font-medium text-stone-800 mb-4">RSVP Status</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={rsvpStatus}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {rsvpStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </AdminCard>

                {/* Group Distribution */}
                <AdminCard>
                    <h3 className="text-lg font-medium text-stone-800 mb-4">Guest Groups</h3>
                    {groups.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={groups}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8B9A7D" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[250px] text-stone-400 text-sm">
                            No guest groups found
                        </div>
                    )}
                </AdminCard>

                {/* RSVP Timeline Graph */}
                <AdminCard className="lg:col-span-2">
                    <h3 className="text-lg font-medium text-stone-800 mb-6">RSVP Cumulative Timeline</h3>
                    {timeline && timeline.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={timeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#A67B5B" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#A67B5B" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#8B7B6B" fontSize={12} tickMargin={10} />
                                <YAxis stroke="#8B7B6B" fontSize={12} tickMargin={10} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(166, 123, 91, 0.15)' }}
                                    itemStyle={{ color: '#4A3F35', fontWeight: 600 }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="total" 
                                    name="Total Confirmed" 
                                    stroke="#A67B5B" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorTotal)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-stone-400">
                            Not enough data for timeline
                        </div>
                    )}
                </AdminCard>
            </div>
        </AdminPageLayout>
    );
}


