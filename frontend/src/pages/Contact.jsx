import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Mail, User, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { enquiryService } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  MainFlowerTopLeft, 
  MainFlowerBottomRight, 
  FlowerDivider,
  CenteredFlower
} from '../components/CustomIllustrations';
import { useContent } from '../context/ContentContext';
import { fadeInUp, staggerContainer, staggerItem } from '../hooks/useScrollAnimation';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';

const getContent = (content, section, field, i18n, fallback) => {
  const sectionData = content?.[section]?.content;
  const val = sectionData?.[field];
  
  if (!val) return fallback;
  
  if (typeof val === 'object') {
    return val[i18n.language] || val['en'] || fallback;
  }
  return val;
};

export default function Contact() {
  const { t, i18n } = useTranslation();
  const { contents: content, loading: contentLoading } = useContent();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'guest',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const getTxt = (section, field, fallback) => getContent(content, section, field, i18n, fallback);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await enquiryService.send(formData);
      setSuccess(true);
      setFormData({ name: '', email: '', type: 'guest', subject: '', message: '' });
    } catch (err) {
      console.error('Failed to send enquiry:', err);
      setError('Failed to send your message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    if (!contentLoading && !content['contact']?.is_visible !== false && content['contact']?.is_visible === false) {
      navigate('/module-unavailable/contact');
    }
  }, [contentLoading, content, navigate]);

  if (contentLoading) return <Loader />;

  if (content && content['contact']?.is_visible === false) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#FFF9F5] flex flex-col"
    >
      <Navbar />

      <main className="flex-grow pt-32 pb-20 relative overflow-hidden">
        <MainFlowerTopLeft size={300} className="opacity-40" />
        <MainFlowerBottomRight size={300} className="opacity-40" />

        <div className="container-wedding relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <FlowerDivider />
            <h1 
              className="text-5xl md:text-6xl text-[#A67B5B] mb-4" 
              style={{ fontFamily: "'Great Vibes', cursive" }}
            >
              {getTxt('contact', 'title', 'Get in Touch')}
            </h1>
            <p className="text-[#6B5D52] font-serif text-lg max-w-2xl mx-auto">
              {getTxt('contact', 'description', 'Have questions or need more information? We are here to help. Send us a message and we will get back to you as soon as possible.')}
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-12 rounded-[2.5rem] shadow-xl text-center border border-stone-100"
              >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-serif text-stone-800 mb-4">Message Sent!</h2>
                <p className="text-stone-600 text-lg mb-8">
                  Thank you for reaching out. We have received your message and will get back to you shortly.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="px-10 py-4 bg-[#A67B5B] text-white rounded-full hover:bg-[#8B5E3C] transition-all shadow-lg active:scale-95 font-medium"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-stone-100"
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <motion.div variants={fadeInUp}>
                      <label className="block text-stone-700 font-medium mb-2 ml-1">Your Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                        <input
                          required
                          type="text"
                          placeholder="Full Name"
                          className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-stone-100 focus:border-[#A67B5B] focus:ring-0 transition-all outline-none bg-stone-50/30"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                    </motion.div>

                    <motion.div variants={fadeInUp}>
                      <label className="block text-stone-700 font-medium mb-2 ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                        <input
                          required
                          type="email"
                          placeholder="email@example.com"
                          className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-stone-100 focus:border-[#A67B5B] focus:ring-0 transition-all outline-none bg-stone-50/30"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </motion.div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <motion.div variants={fadeInUp}>
                      <label className="block text-stone-700 font-medium mb-2 ml-1">I am a...</label>
                      <select
                        className="w-full px-5 py-4 rounded-2xl border-2 border-stone-100 focus:border-[#A67B5B] focus:ring-0 transition-all outline-none bg-stone-50/30 appearance-none"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a8a29e' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                      >
                        <option value="guest">Guest</option>
                        <option value="vendor">Vendor</option>
                        <option value="other">Other</option>
                      </select>
                    </motion.div>

                    <motion.div variants={fadeInUp}>
                      <label className="block text-stone-700 font-medium mb-2 ml-1">Subject</label>
                      <input
                        type="text"
                        placeholder="What is this regarding?"
                        className="w-full px-5 py-4 rounded-2xl border-2 border-stone-100 focus:border-[#A67B5B] focus:ring-0 transition-all outline-none bg-stone-50/30"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      />
                    </motion.div>
                  </div>

                  <motion.div variants={fadeInUp}>
                    <label className="block text-stone-700 font-medium mb-2 ml-1">Your Message</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="How can we help you?"
                      className="w-full px-5 py-4 rounded-2xl border-2 border-stone-100 focus:border-[#A67B5B] focus:ring-0 transition-all outline-none bg-stone-50/30 resize-none"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </motion.div>

                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center">
                      {error}
                    </motion.p>
                  )}

                  <motion.div variants={fadeInUp} className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-5 bg-[#A67B5B] text-white rounded-2xl hover:bg-[#8B5E3C] transition-all shadow-lg active:scale-95 font-semibold text-lg flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Message
                        </>
                      )}
                    </button>
                  </motion.div>
                </form>
              </motion.div>
            )}

            <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-8 text-stone-500 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-[#A67B5B]/10 flex items-center justify-center text-[#A67B5B]">
                        <Mail className="w-5 h-5" />
                    </div>
                    <span>tangtzeren@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-[#A67B5B]/10 flex items-center justify-center text-[#A67B5B]">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <span>Direct Enquiries Only</span>
                </div>
            </div>
          </div>
        </div>
      </main>

      <Footer content={content} />
    </motion.div>
  );
}
