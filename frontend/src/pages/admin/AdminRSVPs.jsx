import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, XCircle, MessageSquare, Utensils, Users, Mail, Phone, Hash, Music, ExternalLink } from 'lucide-react';
import { useGuests } from '../../hooks/useApiHooks';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminListPanel from '../../components/admin/AdminListPanel';
import AdminSummaryCards from '../../components/admin/AdminSummaryCards';
import AdminCard from '../../components/admin/AdminCard';
import EmptyState from '../../components/admin/EmptyState';
import Button from '../../components/Button';
import { guestListLink } from '../../utils/rsvp';
import { initials } from '../../utils/adminModules';
import { useSearch } from '../../context/SearchContext';
import { Skeleton } from '../../components/Skeleton';

const FILTERS = [
    { id: 'all', label: 'All responses', icon: Users },
    { id: 'attending', label: 'Attending', icon: CheckCircle },
    { id: 'declined', label: 'Declined', icon: XCircle },
    { id: 'with_messages', label: 'With messages', icon: MessageSquare },
];

function matchesFilter(guest, filter) {
    if (filter === 'attending') return guest.rsvp_status === 'confirmed';
    if (filter === 'declined') return guest.rsvp_status === 'declined';
    if (filter === 'with_messages') return !!guest.rsvp_message;
    return true;
}

export default function AdminRSVPs() {
    const { data: guestsData, isLoading } = useGuests();
    const { searchQuery } = useSearch();
    const [rsvps, setRsvps] = useState([]);
    const [filter, setFilter] = useState('all');
    const [selectedId, setSelectedId] = useState(null);
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

        return matchesFilter(guest, filter);
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-48 bg-stone-100 rounded-3xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

    // The panel lists the households that replied; the selected one is shown in full on the left.
    const selected = filteredRsvps.find((guest) => guest.id === selectedId) || filteredRsvps[0] || null;
    const filterLabel = FILTERS.find((f) => f.id === filter)?.label;

    return (
        <AdminPageLayout
            fill
            hero={
                <AdminPageHero
                    title="RSVP Responses & Messages"
                    description="View statistics and messages left by guests on the RSVP form."
                    breadcrumb="RSVPs"
                    icon={<MessageSquare className="w-5 h-5 text-[#A67B5B]" />}
                />
            }
            summary={<AdminSummaryCards cards={statCards} columns={4} />}
            search="Search RSVPs…"
            filters={{
              groups: [{
                id: 'responses',
                label: 'Show',
                options: FILTERS.map((f) => ({ id: f.id, label: `${f.label} (${rsvps.filter((guest) => matchesFilter(guest, f.id)).length})` })),
                value: filter,
                onChange: setFilter,
              }],
            }}
            panel={{
              id: 'rsvps',
              title: 'Responses',
              icon: MessageSquare,
              subtitle: filter === 'all' && !searchQuery
                ? `${rsvps.length} households replied · newest first`
                : `${filteredRsvps.length} of ${rsvps.length} · ${filterLabel}${searchQuery ? ' matching your search' : ''}`,
              items: filteredRsvps.map((guest) => ({
                id: guest.id,
                label: guest.name,
                description: responseSummary(guest),
                muted: guest.rsvp_status === 'declined',
              })),
              activeId: selected?.id,
              onChange: setSelectedId,
            }}
        >
            <AdminListPanel plain>
                {!selected ? (
                    <EmptyState
                        icon={CheckCircle}
                        message={searchQuery || filter !== 'all' ? 'No responses match' : 'No RSVPs have been submitted yet'}
                        searchQuery={searchQuery}
                    />
                ) : (
                    <ResponseDetail key={selected.id} guest={selected} />
                )}
            </AdminListPanel>
        </AdminPageLayout>
    );
}

const formatWhen = (date) => new Date(date).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

/** "Attending · party of 3 · 2 days ago" for the panel row. */
function responseSummary(guest) {
    const party = 1 + (guest.plus_ones?.length || 0);
    return [
        guest.rsvp_status === 'confirmed' ? 'Attending' : 'Declined',
        party > 1 ? `party of ${party}` : null,
        guest.rsvp_message ? 'message' : null,
        formatDistanceToNow(new Date(guest.updated_at), { addSuffix: true }),
    ].filter(Boolean).join(' · ');
}

function StatusPill({ status, small }) {
    const attending = status === 'confirmed';
    return (
        <span className={`inline-flex items-center gap-1 rounded-full font-medium ${small ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'} ${
            attending ? 'bg-green-50 text-green-700' : status === 'declined' ? 'bg-red-50 text-red-700' : 'bg-stone-100 text-stone-600'}`}>
            {attending ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {attending ? 'Attending' : status === 'declined' ? 'Declined' : 'Pending'}
        </span>
    );
}

function Section({ icon, title, children }) {
    const Icon = icon;
    return (
        <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest !text-stone-400">
                <Icon className="w-3.5 h-3.5" /> {title}
            </h3>
            {children}
        </section>
    );
}

/** Everything about one household's response. */
function ResponseDetail({ guest }) {
    const party = [guest, ...(guest.plus_ones || [])];
    const attendingCount = party.filter((p) => p.rsvp_status === 'confirmed').length;
    const contact = [
        guest.email && { icon: Mail, label: guest.email, href: `mailto:${guest.email}` },
        guest.phone && { icon: Phone, label: guest.phone, href: `tel:${guest.phone}` },
        guest.unique_code && { icon: Hash, label: `Code ${guest.unique_code}` },
    ].filter(Boolean);

    return (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
            <AdminCard>
                <div className="flex flex-col @xl:flex-row @xl:items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-base font-semibold ${
                        guest.rsvp_status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {initials(guest.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-medium text-stone-800 break-words">{guest.name}</h2>
                            <StatusPill status={guest.rsvp_status} />
                        </div>
                        <p className="text-sm text-stone-500 mt-1">
                            {guest.group ? `${guest.group} · ` : ''}Replied {formatWhen(guest.updated_at)}
                        </p>
                        {contact.length > 0 && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-stone-600">
                                {contact.map((item) => {
                                    const Icon = item.icon;
                                    return item.href ? (
                                        <a key={item.label} href={item.href} className="inline-flex items-center gap-1.5 hover:text-[#A67B5B] min-w-0 break-words"><Icon className="w-3.5 h-3.5 shrink-0" />{item.label}</a>
                                    ) : (
                                        <span key={item.label} className="inline-flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" />{item.label}</span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <Button as={Link} to={guestListLink({ q: guest.name })} size="sm" icon={ExternalLink} className="self-start shrink-0">
                        Open in guest list
                    </Button>
                </div>
            </AdminCard>

            <AdminCard className="space-y-6">
                <Section icon={MessageSquare} title="Message">
                    {guest.rsvp_message ? (
                        <blockquote className="bg-[#FAF8F6] p-5 rounded-xl border border-stone-100 text-stone-700 italic leading-relaxed text-[15px]">
                            “{guest.rsvp_message.replace(/^["“]+|["”]+$/g, '')}”
                        </blockquote>
                    ) : (
                        <div className="text-sm text-stone-400 italic">No message.</div>
                    )}
                </Section>

                <Section icon={Users} title={`Party · ${attendingCount} of ${party.length} attending`}>
                    <ul className="divide-y divide-stone-100 border border-stone-100 rounded-xl">
                        {party.map((member) => (
                            <li key={member.id} className="flex flex-col @lg:flex-row @lg:items-center gap-1 @lg:gap-3 px-4 py-3">
                                <span className="flex items-center gap-2 min-w-0 @lg:w-1/3">
                                    <span className="font-medium text-stone-800 truncate">{member.name}</span>
                                    {member.id === guest.id && <span className="text-[10px] uppercase tracking-wider text-stone-400">main guest</span>}
                                </span>
                                <StatusPill status={member.rsvp_status} small />
                                <span className="text-sm text-stone-600 @lg:ml-auto flex items-center gap-1.5 min-w-0">
                                    {member.dietary_notes ? (
                                        <><Utensils className="w-3.5 h-3.5 text-amber-600 shrink-0" /><span className="break-words">{member.dietary_notes}</span></>
                                    ) : <span className="text-stone-400 text-xs italic">No dietary needs</span>}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Section>

                {guest.song_request && (
                    <Section icon={Music} title="Song request">
                        <div className="text-sm text-stone-700">{guest.song_request}</div>
                    </Section>
                )}
            </AdminCard>
        </motion.div>
    );
}
