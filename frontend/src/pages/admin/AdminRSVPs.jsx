import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, MessageSquare, Utensils, Users, Search } from 'lucide-react';
import { useGuests } from '../../hooks/useApiHooks';
import AdminPageHero from '../../components/admin/AdminPageHero';
import { useSearch } from '../../context/SearchContext';
import { Skeleton } from '../../components/Skeleton';

export default function AdminRSVPs() {
    const { data: guestsData, isLoading } = useGuests();
    const { searchQuery } = useSearch();
    const [rsvps, setRsvps] = useState([]);
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

        return matchesPrimary || matchesPlusOnes;
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
        <div className="space-y-6">
            <AdminPageHero
                title="RSVP Responses & Messages"
                description="View statistics and messages left by guests on the RSVP form."
                breadcrumb={[{ label: 'Dashboard', path: '/admin/dashboard' }, { label: 'RSVPs' }]}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 rounded-2xl bg-white shadow-sm border border-stone-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ background: `${stat.color}15` }}
                            >
                                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                            </div>
                        </div>
                        <p className="text-3xl font-semibold mb-1 text-stone-800">
                            {stat.value}
                        </p>
                        <p className="text-sm text-stone-500">
                            {stat.label}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* List of Responses */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                    <h2 className="text-lg font-semibold text-stone-800">Recent Responses</h2>
                </div>
                
                {filteredRsvps.length === 0 ? (
                    <div className="p-12 text-center text-stone-500">
                        {searchQuery ? 'No responses found matching your search.' : 'No RSVPs have been submitted yet.'}
                    </div>
                ) : (
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
                )}
            </div>
        </div>
    );
}
