import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[400px] z-[100]"
                >
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#D4A59A]/30 p-6 overflow-hidden relative">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                            <Cookie size={120} className="rotate-12" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 rounded-xl bg-[#F8E8E0] text-[#A67B5B]">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="font-serif text-lg text-stone-800 font-bold mb-1">Cookie Preferences</h3>
                                    <p className="text-stone-600 text-sm leading-relaxed">
                                        We use cookies to enhance your experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleAccept}
                                    className="w-full py-2.5 bg-[#A67B5B] text-white rounded-xl font-medium hover:bg-[#8D6548] transition-colors shadow-lg shadow-[#A67B5B]/20"
                                >
                                    Accept All
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleDecline}
                                        className="flex-1 py-2 text-stone-500 text-sm font-medium hover:text-stone-800 transition-colors"
                                    >
                                        Decline
                                    </button>
                                    <Link 
                                        to="/privacy-policy" 
                                        className="flex-1 py-2 text-[#A67B5B] text-sm font-medium text-center hover:underline"
                                        onClick={() => setIsVisible(false)}
                                    >
                                        Privacy Policy
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleDecline}
                            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
