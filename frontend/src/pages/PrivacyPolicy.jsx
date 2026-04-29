import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PrivacyPolicy() {
    const sections = [
        {
            icon: Eye,
            title: "Information Collection",
            content: "We collect information you provide directly to us through RSVP forms, guestbook entries, and song requests. This includes your name, email address, and any personal messages you choose to share."
        },
        {
            icon: Lock,
            title: "How We Use Your Data",
            content: "Your data is used solely for organizing the wedding event. We use it to manage guest lists, communicate event updates, and personalize your experience. We do not sell or share your data with third parties for marketing purposes."
        },
        {
            icon: Shield,
            title: "Data Security",
            content: "We implement industry-standard security measures, including 2FA for administrators and encrypted storage, to protect your personal information from unauthorized access."
        },
        {
            icon: Mail,
            title: "Your Rights",
            content: "You have the right to request the deletion of your personal data from our systems at any time. Simply contact us through the provided contact methods."
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-[#FFF9F5]"
        >
            <Navbar />

            <main className="pt-32 pb-20 container-wedding max-w-4xl">
                <Link 
                    to="/" 
                    className="inline-flex items-center gap-2 text-[#A67B5B] hover:text-[#8D6548] transition-colors mb-8 group"
                >
                    <ArrowLeft size={18} className="translate-x-0 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-serif text-stone-800 mb-4">Privacy Policy</h1>
                    <p className="text-stone-500 text-lg italic font-serif">Last updated: February 10, 2026</p>
                </div>

                <div className="grid gap-8">
                    {sections.map((section, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-8 rounded-2xl border border-[#D4A59A]/20 shadow-sm"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-xl bg-[#F8E8E0] text-[#A67B5B]">
                                    <section.icon size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-stone-800">{section.title}</h2>
                            </div>
                            <p className="text-stone-600 leading-relaxed">
                                {section.content}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-16 p-8 bg-[#F8E8E0]/30 rounded-2xl text-center border border-[#A67B5B]/10">
                    <p className="text-stone-700">
                        If you have any questions about this Privacy Policy, please reach out to us.
                    </p>
                </div>
            </main>

            <Footer />
        </motion.div>
    );
}
