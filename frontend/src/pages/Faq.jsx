import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { faqService, contentService } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';
import { Navigate, Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext';

const getContent = (content, section, field, i18n, fallback) => {
  const sectionData = content?.[section]?.content;
  const val = sectionData?.[field];
  
  if (!val) return fallback;
  
  // Handle multi-language object
  if (typeof val === 'object') {
    return val[i18n.language] || val['en'] || fallback;
  }
  
  // Handle legacy string (assume English or universal)
  return val;
};

export default function Faq() {
    const { t, i18n } = useTranslation();
    const { contents: content, loading: contentLoading } = useContent();
    const getTxt = (section, field, fallback) => getContent(content, section, field, i18n, fallback);
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFaqId, setActiveFaqId] = useState(null);
    const answerRef = React.useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const faqRes = await faqService.getAll();
                const loadedFaqs = faqRes.data || [];
                setFaqs(loadedFaqs);
                if (loadedFaqs.length > 0) {
                    setActiveFaqId(loadedFaqs[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch FAQ data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (activeFaqId && window.innerWidth < 768) {
            answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [activeFaqId]);

    if (!contentLoading && content && content['faqs']?.is_visible === false) {
        return <Navigate to="/module-unavailable/faqs" replace />;
    }

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
                            {getTxt('faqs', 'title', 'Frequently Asked Questions')}
                        </h1>
                        <p className="text-[#6B5D52] font-serif text-lg">
                            {getTxt('faqs', 'description', 'Find answers to common questions about our special day.')}
                        </p>
                    </motion.div>

                    {loading ? (
                        <div className="text-center text-[#A67B5B] py-12">Loading answers...</div>
                    ) : faqs.length === 0 ? (
                        <div className="text-center text-stone-500 italic py-12">No FAQs available at the moment. Check back soon!</div>
                    ) : (
                        <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden flex flex-col md:flex-row min-h-[500px] md:min-h-[600px] max-h-none md:max-h-[85vh]">
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
                            <div className="w-full md:w-3/5 lg:w-2/3 p-6 lg:p-12 overflow-y-auto bg-white relative" ref={answerRef}>
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
                                            <div className="sticky top-0 bg-white z-10 pb-6 mb-8 border-b border-stone-100 pt-2 md:pt-0">
                                                <h2 className="font-serif text-2xl md:text-4xl text-stone-800">
                                                    {activeFaq.question}
                                                </h2>
                                            </div>
                                            
                                            <div 
                                                className="text-stone-600 prose prose-stone max-w-none leading-relaxed 
                                                    [overflow-wrap:break-word] [word-wrap:break-word]
                                                    [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-4 
                                                    [&_table]:w-full [&_table]:min-w-[500px] [&_table]:border-collapse [&_table]:my-6 [&_table]:rounded-lg
                                                    [&_th]:!border [&_th]:!border-stone-200 [&_th]:!bg-[#F8E8E0] [&_th]:!p-4 [&_th]:!text-left [&_th]:!font-semibold [&_th]:!text-[#8B7B6B]
                                                    [&_td]:!border [&_td]:!border-stone-200 [&_td]:!p-4 [&_td]:!align-top
                                                    [&_tr:nth-child(even)]:!bg-[#FFF9F5]/80 [&_p]:!my-2 overflow-x-auto scrollbar-thin scrollbar-thumb-stone-200"
                                                dangerouslySetInnerHTML={{ __html: activeFaq.answer }}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                    
                    {(!content || content['guestbook_page']?.is_visible !== false) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="mt-12 md:mt-20 text-center"
                        >
                            <p className="text-stone-500 mb-4">Still have questions?</p>
                            <Link 
                                to="/contact" 
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white border border-[#A67B5B] text-[#A67B5B] rounded-full hover:bg-[#A67B5B] hover:text-white transition-all shadow-sm active:scale-95"
                            >
                                <MessageSquare className="w-4 h-4" /> Enquire Now
                            </Link>
                        </motion.div>
                    )}
                </div>
            </main>

            <Footer content={content} />
        </motion.div>
    );
}
