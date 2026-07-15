import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, MessageSquare, Utensils, Users, LayoutGrid, List } from 'lucide-react';
import { useGuests } from '../../hooks/useApiHooks';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminSummaryCards from '../../components/admin/AdminSummaryCards';
import AdminToolbar from '../../components/admin/AdminToolbar';
import AdminCard from '../../components/admin/AdminCard';
import EmptyState from '../../components/admin/EmptyState';
import { useSearch } from '../../context/SearchContext';
import { Skeleton } from '../../components/Skeleton';

export default function AdminRSVPs() {
    const { data: guestsData, isLoading } = useGuests();
    const { searchQuery, setSearchQuery } = useSearch();
    const [rsvps, setRsvps] = useState([]);
    const [filter, setFilter] = useState('all');
    const [viewMode, setViewMode] = useState('list');
    const [stats, setStats] = useState({ total: 0, attending: 0, declined: 0, withMessage: 0 });

    useEffect(() => {
        if (guestsData) {
            const allGuests = guestsData.data || guestsData;
            
            // Filter to only those who have responded
            const responded = allGuests.filter(g => g.rsvp_status !== 'pending');
            
            // Sort by latest update
            responded.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            
            // Group by primary guest to reduce redundancy
            // We only want to show each "response session" as one card
            const primaryGuests = responded.filter(g => !g.parent_guest_id);
            
            setRsvps(primaryGuests);
            
            // Statistics (Headcount)
            const confirmedCount = responded.filter(g => g.rsvp_status === 'confirmed').length;
            const declinedCount = responded.filter(g => g.rsvp_status === 'declined').length;
            const messageCount = primaryGuests.filter(g => g.rsvp_message).length;

            setStats({
                total: primaryGuests.length,
                attending: confirmedCount,
                declined: declinedCount,
                withMessage: messageCount
            });
        }
    }, [guestsData]);

    const filteredRsvps = rsvps.filter(guest => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        
        // Search primary guest and their plus-ones
        const matchesPrimary = (
            guest.name.toLowerCase().includes(query) ||
            (guest.rsvp_message && guest.rsvp_message.toLowerCase().includes(query)) ||
            (guest.dietary_notes && guest.dietary_notes.toLowerCase().includes(query))
        );
        
        const matchesPlusOnes = guest.plus_ones?.some(po => 
            po.name.toLowerCase().includes(query) || 
            (po.dietary_notes && po.dietary_notes.toLowerCase().includes(query))
        );

        const matchesQuery = matchesPrimary || matchesPlusOnes;
        if (!matchesQuery) return false;

        if (filter === 'with_messages') {
            return !!guest.rsvp_message;
        }

        return true;
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-48 bg-stone-100 rounded-3xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} height="120px" className="rounded-2xl" />
                    ))}
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} height="100px" className="rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Responses', value: stats.total, icon: Users, color: '#4A3F35' },
        { label: 'Attending', value: stats.attending, icon: CheckCircle, color: '#8B9A7D' },
        { label: 'Declined', value: stats.declined, icon: XCircle, color: '#D4A59A' },
        { label: 'With Messages', value: stats.withMessage, icon: MessageSquare, color: '#A67B5B' },
    ];

    return (
        <AdminPageLayout
            hero={
                <AdminPageHero
                    title="RSVP Responses & Messages"
                    description="View statistics and messages left by guests on the RSVP form."
                    breadcrumb="RSVPs"
                    icon={<MessageSquare className="w-5 h-5 text-[#A67B5B]" />}
                />
            }
            summary={<AdminSummaryCards cards={statCards} columns={4} />}
            toolbar={
                <AdminToolbar
                    filters={[
                        { id: 'all', label: 'All Responses' },
                        { id: 'with_messages', label: 'With Messages' },
                    ]}
                    activeFilter={filter}
                    onFilterChange={setFilter}
                    search={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search guests, messages, or dietary notes..."
                    viewMode={viewMode}
                    viewOptions={['list', 'grid']}
                    onViewModeChange={setViewMode}
                />
            }
        >
                <AdminCard padding={false} className="overflow-hidden">
                <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-stone-800">Recent Responses</h2>
                </div>

                {filteredRsvps.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle}
                        message={searchQuery ? 'No responses found matching your search' : 'No RSVPs have been submitted yet'}
                        searchQuery={searchQuery}
                    />
                ) : viewMode === 'list' ? (
                    <div className="divide-y divide-stone-100">
                        {filteredRsvps.map((guest, index) => {
                            const isAttending = guest.rsvp_status === 'confirmed';
                            
                            return (
                                <motion.div 
                                    key={guest.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                                    className="p-6 hover:bg-stone-50 transition-colors"
                                >
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Status Column */}
                                        <div className="w-full md:w-1/3 shrink-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                {isAttending ? (
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-400" />
                                                )}
                                                <h3 className="font-semibold text-stone-800 text-lg">{guest.name}</h3>
                                            </div>
                                            <div className="space-y-1 text-sm text-stone-500 pl-8">
                                                <p>Group: {guest.group}</p>
                                                {guest.plus_ones?.length > 0 && (
                                                    <div className="mt-3 space-y-2">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#A67B5B]">Party Members</p>
                                                        <div className="space-y-1.5">
                                                            {guest.plus_ones.map(po => (
                                                                <div key={po.id} className="flex items-center gap-2 text-xs">
                                                                    {po.rsvp_status === 'confirmed' ? (
                                                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                                                    ) : (
                                                                        <XCircle className="w-3 h-3 text-red-400" />
                                                                    )}
                                                                    <span className="font-medium text-stone-700">{po.name}</span>
                                                                    {po.dietary_notes && (
                                                                        <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                                                                            <Utensils className="w-2.5 h-2.5" /> Dietary
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <p className="text-xs text-stone-400 pt-2">
                                                    {new Date(guest.updated_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Content Column */}
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Message */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                                                    <MessageSquare className="w-3 h-3" />
                                                    Message
                                                </div>
                                                {guest.rsvp_message ? (
                                                    <div className="bg-[#FAF8F6] p-4 rounded-xl border border-stone-100">
                                                        <p className="text-stone-700 italic text-sm leading-relaxed">
                                                            "{guest.rsvp_message}"
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-stone-300 italic text-xs">No message.</p>
                                                )}
                                            </div>

                                            {/* Dietary */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                                                    <Utensils className="w-3 h-3" />
                                                    Dietary Notes
                                                </div>
                                                {guest.dietary_notes ? (
                                                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                                                        <p className="text-stone-700 text-sm leading-relaxed">
                                                            {guest.dietary_notes}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-stone-300 italic text-xs">No special requirements.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredRsvps.map((guest) => (
                            <RsvpGridCard key={guest.id} guest={guest} />
                        ))}
                    </div>
                )}
            </AdminCard>
        </AdminPageLayout>
    );
}

function RsvpGridCard({ guest }) {
    const isAttending = guest.rsvp_status === 'confirmed';
    return (
        <div className="p-5 rounded-2xl bg-white border border-stone-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAttending ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        {isAttending ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className="font-semibold text-stone-800">{guest.name}</h3>
                        <p className="text-xs text-stone-500">{guest.group}</p>
                    </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isAttending ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isAttending ? 'Attending' : 'Declined'}
                </span>
            </div>

            {guest.rsvp_message && (
                <div className="mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Message
                    </p>
                    <p className="text-sm text-stone-700 italic bg-[#FAF8F6] p-3 rounded-xl border border-stone-100">"{guest.rsvp_message}"</p>
                </div>
            )}

            {guest.dietary_notes && (
                <div className="mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center gap-1">
                        <Utensils className="w-3 h-3" /> Dietary
                    </p>
                    <p className="text-sm text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-100">{guest.dietary_notes}</p>
                </div>
            )}

            {guest.plus_ones?.length > 0 && (
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#A67B5B] mb-2">Party Members</p>
                    <div className="flex flex-wrap gap-2">
                        {guest.plus_ones.map(po => (
                            <span key={po.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-stone-100 text-stone-700">
                                {po.rsvp_status === 'confirmed' ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-400" />}
                                {po.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-xs text-stone-400 mt-4 pt-3 border-t border-stone-100">
                {new Date(guest.updated_at).toLocaleString()}
            </p>
        </div>
    );
}
