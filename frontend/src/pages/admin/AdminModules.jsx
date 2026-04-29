import { useState, useEffect } from 'react';
import { contentService } from '../../services/api';
import { Layout, Check, X, Loader2, Save, Sparkles, Home, Calendar, Users, Image as ImageIcon, Gift, Music, MessageSquare, HelpCircle, FileText, Globe, Clock, Mail, Languages } from 'lucide-react';
import AdminPageHero from '../../components/admin/AdminPageHero';
import { toast } from 'react-hot-toast';
import { useContent } from '../../context/ContentContext';

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
    const [saving, setSaving] = useState(null);

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

    if (loading) return <div className="p-8 text-center text-stone-500">Loading modules...</div>;

    return (
        <div className="space-y-6 pb-20">
            <AdminPageHero
                title="Module Management"
                description="Enable or disable features and pages on your wedding website"
                breadcrumb={[
                    { label: 'Dashboard', path: '/admin/dashboard' },
                    { label: 'Modules' },
                ]}
                icon={<Layout className="w-5 h-5 text-[#A67B5B]" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MODULES.map(module => {
                    const active = isVisible(module.key);
                    const isSaving = saving === module.key;

                    return (
                        <div 
                            key={module.key}
                            className={`bg-white rounded-2xl p-6 border transition-all ${active ? 'border-[#A67B5B]/20 shadow-sm' : 'border-stone-100 opacity-75'}`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${active ? 'bg-[#A67B5B]/10 text-[#A67B5B]' : 'bg-stone-100 text-stone-400'}`}>
                                    <module.icon className="w-6 h-6" />
                                </div>
                                <button
                                    onClick={() => toggleModule(module.key, active)}
                                    disabled={isSaving}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${active ? 'bg-[#A67B5B]' : 'bg-stone-200'}`}
                                >
                                    <span className="sr-only">Toggle {module.label}</span>
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                    {isSaving && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-full">
                                            <Loader2 className="w-3 h-3 animate-spin text-white" />
                                        </div>
                                    )}
                                </button>
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
                        </div>
                    );
                })}
            </div>
            
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
        </div>
    );
}
