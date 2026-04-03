import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Calendar, MapPin, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGuestByCode, useSettings, useContent } from '../hooks/useApiHooks';
import InvitationCanvas from '../components/admin/InvitationCanvas';
import Loader from '../components/Loader';

export default function DigitalInvitation() {
    const { code } = useParams();
    const navigate = useNavigate();
    const [scale, setScale] = useState(1);
    
    const { data: guest, isLoading: isGuestLoading, isError: isGuestError } = useGuestByCode(code);
    const { data: settings, isLoading: isSettingsLoading } = useSettings();

    const isLoading = isGuestLoading || isSettingsLoading;
    
    const design = settings?.invitation_theme || {
        backgroundColor: '#ffffff',
        accentColor: '#A67B5B',
        orientation: 'portrait',
        items: []
    };

    const weddingDate = settings?.wedding_date || '2026-11-14';
    const venueName = settings?.venue_name || 'The Grand Estate';
    
    const formattedDate = new Date(weddingDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    useEffect(() => {
        const handleResize = () => {
            const containerWidth = window.innerWidth > 1024 ? 540 : (window.innerWidth - 32);
            const canvasWidth = design.orientation === 'landscape' ? 625 : 500;
            
            if (containerWidth < canvasWidth) {
                setScale(containerWidth / canvasWidth);
            } else {
                setScale(1);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [design.orientation]);

    if (isLoading) return <Loader />;

    if (isGuestError || !guest) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-stone-100">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-stone-800 mb-2">Invitation Not Found</h1>
                    <p className="text-stone-500 mb-8">We couldn't find an invitation matching that code. Please check your link and try again.</p>
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full bg-[#A67B5B] text-white py-4 rounded-xl font-bold hover:bg-[#8C6A4D] transition-colors"
                    >
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcfaf8] selection:bg-[#A67B5B]/10">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-[#A67B5B]/10 blur-[120px] rounded-full" />
                <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] bg-[#8C6A4D]/10 blur-[150px] rounded-full" />
            </div>

            <div className="relative max-w-screen-xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:justify-center">
                
                {/* Left Side: The Interactive Card */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-[540px] flex flex-col items-center"
                >
                    <div 
                        className="relative origin-top transition-transform duration-300"
                        style={{ 
                            transform: `scale(${scale})`,
                            height: (design.orientation === 'landscape' ? 500 : 625) * scale,
                            width: (design.orientation === 'landscape' ? 625 : 500) * scale,
                        }}
                    >
                        <InvitationCanvas 
                            design={design}
                            mode="preview"
                            guest={guest}
                            weddingSettings={{ wedding_date: weddingDate, venue_name: venueName }}
                        />
                    </div>
                    
                    <p className="text-center text-stone-400 text-xs mt-6 font-medium uppercase tracking-[0.2em] animate-pulse">
                        Interactive Invitation
                    </p>
                </motion.div>

                {/* Right Side: Welcome & Actions */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="w-full max-w-lg space-y-10"
                >
                    <div className="text-center lg:text-left space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#A67B5B]/10 text-[#A67B5B] rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Official Invitation
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif text-stone-800 leading-tight">
                            Hi {guest.name}, <br />
                            <span className="text-[#A67B5B]">You're Invited!</span>
                        </h1>
                        <p className="text-lg text-stone-500 leading-relaxed max-w-md mx-auto lg:mx-0">
                            We are so happy to share our special day with you. Please see the details below and kindly let us know if you can join us.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="w-10 h-10 bg-[#fcfaf8] text-[#A67B5B] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#A67B5B] group-hover:text-white transition-colors">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-stone-800 mb-1 italic">When</h3>
                            <p className="text-sm text-stone-500">{formattedDate}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="w-10 h-10 bg-[#fcfaf8] text-[#A67B5B] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#A67B5B] group-hover:text-white transition-colors">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-stone-800 mb-1 italic">Where</h3>
                            <p className="text-sm text-stone-500">{venueName}</p>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={() => navigate(`/rsvp/${guest.unique_code}`)}
                            className="flex-1 bg-[#A67B5B] text-white px-8 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#8C6A4D] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#A67B5B]/20 group"
                        >
                            Respond to RSVP
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        
                        <button 
                            className="px-8 py-5 rounded-2xl font-bold text-stone-600 border-2 border-stone-200 hover:bg-stone-50 transition-colors"
                            onClick={() => window.print()}
                        >
                            Save Invitation
                        </button>
                    </div>
                    
                    {guest.rsvp_status !== 'pending' && (
                         <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-4 rounded-xl text-center font-medium ${guest.rsvp_status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                         >
                            Status: You have already {guest.rsvp_status === 'confirmed' ? 'confirmed' : 'declined'} this invitation.
                         </motion.div>
                    )}

                    <div className="pt-8 border-t border-stone-200/60">
                        <p className="text-stone-400 text-sm text-center lg:text-left italic">
                            With love, <br />
                            <span className="font-serif text-stone-600 not-italic">Dinah & Tze Ren</span>
                        </p>
                    </div>
                </motion.div>
            </div>

            <footer className="py-12 border-t border-stone-100 mt-20 text-center">
                <p className="text-stone-400 text-xs uppercase tracking-widest font-medium">
                    Dinah & Tze Ren Wedding 2026
                </p>
            </footer>
        </div>
    );
}
