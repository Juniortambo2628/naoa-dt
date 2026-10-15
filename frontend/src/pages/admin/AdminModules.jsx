import { useState } from 'react';
import { useSearch } from '../../context/SearchContext';
import { contentService } from '../../services/api';
import { Layout, Check, X, Save, Eye, EyeOff, Sparkles, Home, Calendar, Users, Image as ImageIcon, Gift, Music, MessageSquare, HelpCircle, FileText, Globe, Clock, Mail, Languages } from 'lucide-react';
import AdminCard from '../../components/admin/AdminCard';
import EmptyState from '../../components/admin/EmptyState';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import ToggleButton from '../../components/admin/ToggleButton';
import { toast } from 'react-hot-toast';
import { useContent } from '../../context/ContentContext';
import { confirmAction } from '../../utils/feedback';

const MODULES = [
    { key: 'home_hero', label: 'Home Hero', icon: Home, description: 'Main landing section with couple names and venue.' },
    { key: 'countdown', label: 'Countdown Timer', icon: Calendar, description: 'Countdown to the big day.' },
    { key: 'our_story', label: 'Our Story', icon: Sparkles, description: 'The story of how you met.' },
    { key: 'events', label: 'Wedding Timeline (Home)', icon: Clock, description: 'The timeline section displayed on your home page.' },
    { key: 'gallery', label: 'Gallery', icon: ImageIcon, description: 'Photo gallery section.' },
    { key: 'rsvp', label: 'RSVP Feature', icon: Users, description: 'The RSVP system and respond button.' },
    { key: 'gifts', label: 'Gift Registry', icon: Gift, description: 'Gift registry and message.' },
    { key: 'programme_page', label: 'Events Page (Full)', icon: FileText, description: 'The dedicated page showing your full wedding schedule.' },
    { key: 'songs_page', label: 'Song Requests', icon: Music, description: 'Allow guests to request songs.' },
    { key: 'guestbook_page', label: 'Guestbook', icon: MessageSquare, description: 'Message board for guests.' },
    { key: 'faqs', label: 'FAQ Page', icon: HelpCircle, description: 'Frequently Asked Questions page.' },
    { key: 'contact', label: 'Contact Module', icon: Mail, description: 'Direct enquiry form for guests and vendors.' },
    { key: 'language_switcher', label: 'Language Switcher', icon: Languages, description: 'Allow visitors to toggle website language.' },
    { key: 'footer', label: 'Footer Section', icon: Globe, description: 'Website footer with contact info.' },
];



export default function AdminModules() {
    const { contents, loading, isVisible, updateLocalContent } = useContent();
    const [, setSaving] = useState(null);
    const { searchQuery } = useSearch();
    const [statusFilter, setStatusFilter] = useState('all');
    const [bulkSaving, setBulkSaving] = useState(false);

    const searchLower = (searchQuery || '').trim().toLowerCase();
    const visibleModules = MODULES.filter(m =>
        (!searchLower || `${m.label} ${m.description}`.toLowerCase().includes(searchLower))
        && (statusFilter === 'all' || (statusFilter === 'enabled') === isVisible(m.key)));

    const setAllModules = async (enabled) => {
        const targets = MODULES.filter(m => isVisible(m.key) !== enabled);
        if (targets.length === 0) return;
        if (!await confirmAction(`${enabled ? 'Enable' : 'Disable'} ${targets.length} modules?`)) return;
        setBulkSaving(true);
        targets.forEach(m => updateLocalContent(m.key, { is_visible: enabled }));
        const results = await Promise.allSettled(targets.map(m => contentService.update(m.key, {
            is_visible: enabled,
            content: contents[m.key]?.content || {},
        })));
        const failed = targets.filter((m, i) => results[i].status === 'rejected');
        failed.forEach(m => updateLocalContent(m.key, { is_visible: !enabled }));
        if (failed.length) toast.error(`Failed to update ${failed.length} modules`);
        else toast.success(`All modules ${enabled ? 'enabled' : 'disabled'}`);
        setBulkSaving(false);
    };

    const toggleModule = async (key, currentStatus) => {
        const newStatus = !currentStatus;
        
        // Optimistic update
        updateLocalContent(key, { is_visible: newStatus });
        
        setSaving(key);
        try {
            await contentService.update(key, {
                is_visible: newStatus,
                content: contents[key]?.content || {}
            });
            toast.success(`${MODULES.find(m => m.key === key)?.label} ${newStatus ? 'enabled' : 'disabled'}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update module");
            // Revert optimistic update on failure
            updateLocalContent(key, { is_visible: currentStatus });
        } finally {
            setSaving(null);
        }
    };

    if (loading) return <EmptyState loading rows={6} />;

    return (
        <AdminPageLayout
          actions={[
            { id: 'enable-all', label: 'Enable All', icon: Eye, variant: 'secondary', onClick: () => setAllModules(true), disabled: bulkSaving },
            { id: 'disable-all', label: 'Disable All', icon: EyeOff, onClick: () => setAllModules(false), disabled: bulkSaving },
          ]}
          search="Search modules…"
          filters={{
            groups: [{
              id: 'status',
              label: 'Status',
              options: [
                { id: 'all', label: 'All' },
                { id: 'enabled', label: 'Enabled' },
                { id: 'disabled', label: 'Disabled' },
              ],
              value: statusFilter,
              onChange: setStatusFilter,
            }],
          }}
          hero={
            <AdminPageHero
              title="Module Management"
              description="Enable or disable features and pages on your wedding website"
              breadcrumb="Modules"
              icon={<Layout className="w-5 h-5 text-[#A67B5B]" />}
            />
          }
        >

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleModules.map(module => {
                    const active = isVisible(module.key);

                    return (
                        <AdminCard 
                            key={module.key}
                            className={`transition-all ${active ? 'border-[#A67B5B]/20' : 'border-stone-100 opacity-75'}`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${active ? 'bg-[#A67B5B]/10 text-[#A67B5B]' : 'bg-stone-100 text-stone-400'}`}>
                                    <module.icon className="w-6 h-6" />
                                </div>
                                <ToggleButton
                                    enabled={active}
                                    onToggle={() => toggleModule(module.key, active)}
                                    label={`Toggle ${module.label}`}
                                />
                            </div>

                            <h3 className={`font-semibold mb-1 ${active ? 'text-stone-800' : 'text-stone-400'}`}>{module.label}</h3>
                            <p className="text-sm text-stone-500 leading-relaxed">{module.description}</p>
                            
                            <div className="mt-4 flex items-center gap-2">
                                {active ? (
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded">Active</span>
                                ) : (
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 bg-stone-50 px-2 py-0.5 rounded">Disabled</span>
                                )}
                            </div>
                        </AdminCard>
                    );
                })}
            </div>
            {visibleModules.length === 0 && (
                <p className="text-center py-8 text-stone-400">No modules match your search or filter.</p>
            )}

            <div className="bg-[#A67B5B]/5 border border-[#A67B5B]/10 p-6 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                    <HelpCircle className="w-5 h-5 text-[#A67B5B]" />
                </div>
                <div>
                    <h4 className="font-semibold text-stone-800 text-sm">Pro Tip</h4>
                    <p className="text-sm text-stone-600 mt-1">
                        Disabling a module hides it from the public website navigation and prevents access to its specific page. 
                        Your saved content remains safe and will reappear when you re-enable the module.
                    </p>
                </div>
            </div>
        </AdminPageLayout>
    );
}
