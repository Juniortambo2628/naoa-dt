import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { faqService, contentService } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Faq() {
    const [faqs, setFaqs] = useState([]);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeFaqId, setActiveFaqId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [faqRes, contentRes] = await Promise.all([
                    faqService.getAll(),
                    contentService.getAll().catch(() => ({ data: null }))
                ]);
                const loadedFaqs = faqRes.data || [];
                setFaqs(loadedFaqs);
                if (loadedFaqs.length > 0) {
                    setActiveFaqId(loadedFaqs[0].id);
                }
                if (contentRes.data) {
                    setContent(contentRes.data);
                }
            } catch (error) {
                console.error("Failed to fetch FAQ data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const activeFaq = faqs.find(f => f.id === activeFaqId);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-[#FFF9F5] font-sans flex flex-col"
        >
            <Navbar />
            
            <main className="flex-grow pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl md:text-5xl text-[#A67B5B] mb-4" style={{ fontFamily: "'Great Vibes', cursive" }}>
                            Frequently Asked Questions
                        </h1>
                        <p className="text-[#6B5D52] font-serif text-lg">
                            Find answers to common questions about our special day.
                        </p>
                    </motion.div>

                    {loading ? (
                        <div className="text-center text-[#A67B5B] py-12">Loading answers...</div>
                    ) : faqs.length === 0 ? (
                        <div className="text-center text-stone-500 italic py-12">No FAQs available at the moment. Check back soon!</div>
                    ) : (
                        <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden flex flex-col md:flex-row min-h-[600px] max-h-[85vh]">
                            {/* Left Column: Questions List */}
                            <div className="w-full md:w-2/5 lg:w-1/3 bg-[#FFF9F5]/30 border-b md:border-b-0 md:border-r border-stone-100 flex flex-col">
                                <div className="p-6 lg:p-8 border-b border-stone-100">
                                    <h2 className="font-serif text-2xl text-stone-800">Topics</h2>
                                </div>
                                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2">
                                    {faqs.map((faq) => {
                                        const isActive = activeFaqId === faq.id;
                                        return (
                                            <button
                                                key={faq.id}
                                                onClick={() => setActiveFaqId(faq.id)}
                                                className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-300 flex items-center justify-between group ${
                                                    isActive 
                                                        ? 'bg-white shadow-sm border border-stone-100' 
                                                        : 'border border-transparent hover:bg-white/50 hover:border-stone-100'
                                                }`}
                                            >
                                                <span className={`font-serif text-lg pr-4 ${isActive ? 'text-[#A67B5B]' : 'text-stone-600 group-hover:text-stone-800'}`}>
                                                    {faq.question}
                                                </span>
                                                <ChevronRight 
                                                    className={`w-5 h-5 flex-shrink-0 transition-transform ${isActive ? 'text-[#A67B5B] translate-x-1' : 'text-stone-300 group-hover:text-stone-400'}`} 
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            {/* Right Column: Active Answer */}
                            <div className="w-full md:w-3/5 lg:w-2/3 p-6 lg:p-12 overflow-y-auto bg-white relative">
                                <AnimatePresence mode="popLayout">
                                    {activeFaq && (
                                        <motion.div
                                            key={activeFaq.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="h-full"
                                        >
                                            <h2 className="font-serif text-3xl md:text-4xl text-stone-800 mb-8 pb-6 border-b border-stone-100">
                                                {activeFaq.question}
                                            </h2>
                                            
                                            <div 
                                                className="text-stone-600 prose prose-stone max-w-none break-words leading-relaxed 
                                                    [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-4 
                                                    [&_table]:w-full [&_table]:table-fixed [&_table]:border-collapse [&_table]:my-6 [&_table]:rounded-lg [&_table]:overflow-hidden
                                                    [&_th]:!border [&_th]:!border-stone-200 [&_th]:!bg-[#F8E8E0] [&_th]:!p-4 [&_th]:!text-left [&_th]:!font-semibold [&_th]:!text-[#8B7B6B]
                                                    [&_td]:!border [&_td]:!border-stone-200 [&_td]:!p-4 [&_td]:!align-top
                                                    [&_tr:nth-child(even)]:!bg-[#FFF9F5]/80 [&_p]:!my-2 overflow-x-auto"
                                                dangerouslySetInnerHTML={{ __html: activeFaq.answer }}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                    
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-20 text-center"
                    >
                        <p className="text-stone-500 mb-4">Still have questions?</p>
                        <a 
                            href="/guestbook" 
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-[#A67B5B] text-[#A67B5B] rounded-full hover:bg-[#A67B5B] hover:text-white transition-colors shadow-sm"
                        >
                            <MessageSquare className="w-4 h-4" /> Drop us a message
                        </a>
                    </motion.div>
                </div>
            </main>

            <Footer content={content} />
        </motion.div>
    );
}
