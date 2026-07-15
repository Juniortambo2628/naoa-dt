import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronRight, X, ArrowLeft } from 'lucide-react';
import { faqService, contentService } from '../services/api';
import Navbar from '../components/Navbar';
import { useTranslation } from 'react-i18next';
import { Navigate, Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext';

const getContent = (content, section, field, i18n, fallback) => {
  const sectionData = content?.[section]?.content;
  const val = sectionData?.[field];
  
  if (!val) return fallback;
  
  if (typeof val === 'object') {
    return val[i18n.language] || val['en'] || fallback;
  }
  
  return val;
};

export default function Faq() {
    const { t, i18n } = useTranslation();
    const { contents: content, loading: contentLoading } = useContent();
    const getTxt = (section, field, fallback) => getContent(content, section, field, i18n, fallback);
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFaqId, setActiveFaqId] = useState(null);
    const [expandedTableHtml, setExpandedTableHtml] = useState(null);
    const [mobileView, setMobileView] = useState('list');
    const answerRef = React.useRef(null);
    const mobileAnswerRef = React.useRef(null);
    const activeFaq = faqs.find(f => f.id === activeFaqId);

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
        const container = answerRef.current || mobileAnswerRef.current;
        if (container && activeFaq) {
            const timer = setTimeout(() => {
                const tables = container.querySelectorAll('table');
                tables.forEach((table) => {
                    if (!table.parentElement.classList.contains('table-scroll-container')) {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'table-wrapper relative my-4 rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden';
                        
                        const header = document.createElement('div');
                        header.className = 'bg-[#FFF9F5] px-3 py-2 border-b border-stone-200 flex justify-between items-center';
                        const titleSpan = document.createElement('span');
                        titleSpan.className = 'text-xs font-semibold text-stone-700';
                        titleSpan.innerText = 'Table Data';
                        
                        const expandBtn = document.createElement('button');
                        expandBtn.className = 'expand-table-btn text-xs bg-white border border-[#A67B5B] text-[#A67B5B] px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-[#A67B5B] hover:text-white transition-colors font-medium shadow-sm';
                        expandBtn.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                            View
                        `;
                        expandBtn.onclick = () => {
                            setExpandedTableHtml(table.outerHTML);
                        };
                        
                        header.appendChild(titleSpan);
                        header.appendChild(expandBtn);
                        
                        const scrollContainer = document.createElement('div');
                        scrollContainer.className = 'table-scroll-container overflow-x-auto p-0';
                        
                        table.parentNode.insertBefore(wrapper, table);
                        scrollContainer.appendChild(table);
                        wrapper.appendChild(header);
                        wrapper.appendChild(scrollContainer);
                    }
                });
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [activeFaqId, activeFaq, mobileView]);

    const handleFaqSelect = (faqId) => {
        setActiveFaqId(faqId);
        setMobileView('answer');
    };

    const handleBackToList = () => {
        setMobileView('list');
    };

    if (!contentLoading && content && content['faqs']?.is_visible === false) {
        return <Navigate to="/module-unavailable/faqs" replace />;
    }


    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen bg-[#FFF9F5] font-sans flex flex-col overflow-hidden"
        >
            <Navbar />
            
            <main className="flex-1 flex flex-col pt-20 pb-4 overflow-hidden">
                <div className="w-full px-4 md:px-8 lg:px-12 mx-auto flex flex-col flex-1 min-h-0">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-6"
                    >
                        <h1 className="text-3xl md:text-4xl text-[#A67B5B] mb-2" style={{ fontFamily: "'Great Vibes', cursive" }}>
                            {getTxt('faqs', 'title', 'Frequently Asked Questions')}
                        </h1>
                        <p className="text-[#6B5D52] font-serif text-base">
                            {getTxt('faqs', 'description', 'Find answers to common questions about our special day.')}
                        </p>
                    </motion.div>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center text-[#A67B5B]">Loading answers...</div>
                    ) : faqs.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-stone-500 italic">No FAQs available at the moment. Check back soon!</div>
                    ) : (
                        <>
                            {/* Mobile: Single card with view toggle */}
                            <div className="flex-1 md:hidden bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden flex flex-col min-h-0">
                                <AnimatePresence mode="wait">
                                    {mobileView === 'list' ? (
                                        <motion.div
                                            key="list"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex-1 flex flex-col min-h-0"
                                        >
                                            <div className="px-6 py-4 border-b border-stone-100 shrink-0">
                                                <h2 className="font-serif text-lg text-stone-800">Topics</h2>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                                                {faqs.map((faq) => (
                                                    <button
                                                        key={faq.id}
                                                        onClick={() => handleFaqSelect(faq.id)}
                                                        className="w-full text-left px-4 py-4 rounded-xl transition-all duration-300 flex items-center justify-between group border border-transparent hover:bg-white/50 hover:border-stone-100 active:scale-[0.98]"
                                                    >
                                                        <span className="font-serif text-base pr-3 text-stone-600 group-hover:text-stone-800">
                                                            {faq.question}
                                                        </span>
                                                        <ChevronRight className="w-4 h-4 flex-shrink-0 text-stone-300 group-hover:text-stone-400" />
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="answer"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex-1 flex flex-col min-h-0"
                                        >
                                            <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-3 shrink-0">
                                                <button
                                                    onClick={handleBackToList}
                                                    className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition-colors text-[#A67B5B]"
                                                >
                                                    <ArrowLeft className="w-5 h-5" />
                                                </button>
                                                <span className="font-serif text-sm text-stone-500 truncate">
                                                    {activeFaq?.question}
                                                </span>
                                            </div>
                                            <div 
                                                className="flex-1 overflow-y-auto"
                                                ref={mobileAnswerRef}
                                                style={{
                                                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 92%, transparent 100%)',
                                                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 92%, transparent 100%)',
                                                }}
                                            >
                                                <div className="px-5 py-8 pb-16">
                                                    <div 
                                                        className="faq-answer-prose text-stone-600 prose prose-stone max-w-none leading-relaxed"
                                                        dangerouslySetInnerHTML={{ __html: activeFaq?.answer || '' }}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Desktop: Two-column layout */}
                            <div className="hidden md:flex flex-1 bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden flex-row min-h-0">
                                {/* Left Column: Questions List */}
                                <div className="w-72 shrink-0 bg-[#FFF9F5]/30 border-r border-stone-100 flex flex-col min-h-0">
                                    <div className="px-6 py-4 border-b border-stone-100">
                                        <h2 className="font-serif text-lg text-stone-800">Topics</h2>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                                        {faqs.map((faq) => {
                                            const isActive = activeFaqId === faq.id;
                                            return (
                                                <button
                                                    key={faq.id}
                                                    onClick={() => setActiveFaqId(faq.id)}
                                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-between group ${
                                                        isActive 
                                                            ? 'bg-white shadow-sm border border-stone-100' 
                                                            : 'border border-transparent hover:bg-white/50 hover:border-stone-100'
                                                    }`}
                                                >
                                                    <span className={`font-serif text-base pr-3 ${isActive ? 'text-[#A67B5B]' : 'text-stone-600 group-hover:text-stone-800'}`}>
                                                        {faq.question}
                                                    </span>
                                                    <ChevronRight 
                                                        className={`w-4 h-4 flex-shrink-0 transition-transform ${isActive ? 'text-[#A67B5B] translate-x-1' : 'text-stone-300 group-hover:text-stone-400'}`} 
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                {/* Right Column: Answer Only */}
                                <div 
                                    className="flex-1 min-w-0 overflow-y-auto bg-white relative"
                                    ref={answerRef}
                                    style={{
                                        maskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 90%, transparent 100%)',
                                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 90%, transparent 100%)',
                                    }}
                                >
                                    <div className="px-8 lg:px-16 py-10 pt-16 pb-20">
                                        <AnimatePresence mode="popLayout">
                                            {activeFaq && (
                                                <motion.div
                                                    key={activeFaq.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <div 
                                                        className="faq-answer-prose text-stone-600 prose prose-stone max-w-none leading-relaxed"
                                                        dangerouslySetInnerHTML={{ __html: activeFaq.answer }}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {(!content || content['guestbook_page']?.is_visible !== false) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="mt-3 text-center shrink-0"
                        >
                            <p className="text-stone-500 mb-2 text-sm">Still have questions?</p>
                            <Link 
                                to="/contact" 
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-[#A67B5B] text-[#A67B5B] rounded-full hover:bg-[#A67B5B] hover:text-white transition-all shadow-sm active:scale-95 text-sm"
                            >
                                <MessageSquare className="w-3.5 h-3.5" /> Enquire Now
                            </Link>
                        </motion.div>
                    )}
                </div>
            </main>

            {/* Expanded Table Modal */}
            <AnimatePresence>
                {expandedTableHtml && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-8"
                        onClick={() => setExpandedTableHtml(null)}
                    >
                        <motion.div 
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-6xl max-h-[85vh] md:max-h-[90vh] flex flex-col overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-stone-100 flex justify-between items-center bg-[#FFF9F5] shrink-0">
                                <h3 className="font-serif text-lg md:text-xl text-stone-800">Table View</h3>
                                <button 
                                    onClick={() => setExpandedTableHtml(null)}
                                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-white rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="overflow-auto flex-1 bg-white faq-answer-prose">
                                <div className="p-4 md:p-6" dangerouslySetInnerHTML={{ __html: expandedTableHtml }} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
