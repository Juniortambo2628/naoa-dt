import { Link } from 'react-router-dom';
import { Heart, Instagram, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { LeafDivider } from './FloralDecorations';
import { useTranslation } from 'react-i18next';

// Helper to resolve dynamic content
const getContent = (content, section, field, i18n, fallback) => {
  const val = content?.[section]?.content?.[field];
  if (!val) return fallback;
  if (typeof val === 'object') {
    return val[i18n.language] || val['en'] || fallback;
  }
  return val;
};

export default function Footer({ content }) {
  const currentYear = new Date().getFullYear();
  const { i18n } = useTranslation();
  const getTxt = (field, fallback) => getContent(content, 'footer', field, i18n, fallback);

  return (
    <footer style={{ background: 'linear-gradient(180deg, #F8E8E0 0%, #E8D4C8 100%)' }}>
      {/* Main Footer */}
      <div className="container-wedding py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <LeafDivider />
          <h3 
            className="text-4xl mb-4"
            style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
          >
            {getTxt('couple_names', 'Dinah & Tze Ren')}
          </h3>
          <p 
            className="text-lg"
            style={{ color: '#6B5D52', fontFamily: "'Cormorant Garamond', serif" }}
          >
             {getContent(content, 'home_hero', 'date_text', i18n, 'June 15th, 2025')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 text-center md:text-left">
          {/* Quick Links */}
          <div>
            <h4 
              className="text-lg font-medium mb-6"
              style={{ color: '#4A3F35', fontFamily: "'Cormorant Garamond', serif" }}
            >
              Quick Links
            </h4>
            <div className="space-y-3">
              {[
                { label: 'Home', path: '/' },
                { label: 'RSVP', path: '/rsvp' },
                { label: 'Programme', path: '/programme' },
                { label: 'Gifts', path: '/gifts' },
                { label: 'FAQs', path: '/faq' },
                { label: 'Privacy Policy', path: '/privacy-policy' }
              ].map((item) => (
                <Link 
                  key={item.label}
                  to={item.path} 
                  className="block transition-colors hover:translate-x-1 transform"
                  style={{ color: '#6B5D52' }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 
              className="text-lg font-medium mb-6"
              style={{ color: '#4A3F35', fontFamily: "'Cormorant Garamond', serif" }}
            >
              Get in Touch
            </h4>
            <div className="space-y-4">
              <a 
                href={`mailto:${getTxt('contact_email', 'wedding@dinahandtzeren.com')}`}
                className="flex items-center justify-center md:justify-start gap-3 transition-colors"
                style={{ color: '#6B5D52' }}
              >
                <Mail className="w-5 h-5" style={{ color: '#A67B5B' }} />
                <span>{getTxt('contact_email', 'wedding@dinahandtzeren.com')}</span>
              </a>
              <a 
                href="tel:+254700000000" 
                className="flex items-center justify-center md:justify-start gap-3 transition-colors"
                style={{ color: '#6B5D52' }}
              >
                <Phone className="w-5 h-5" style={{ color: '#A67B5B' }} />
                <span>+254 700 000 000</span>
              </a>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 
              className="text-lg font-medium mb-6"
              style={{ color: '#4A3F35', fontFamily: "'Cormorant Garamond', serif" }}
            >
              Follow Our Journey
            </h4>
            <div className="flex justify-center md:justify-start gap-4">
              <a 
                href="https://instagram.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ 
                  background: 'rgba(166, 123, 91, 0.1)',
                  color: '#A67B5B',
                }}
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
            <p 
              className="mt-4 text-sm"
              style={{ color: '#8B7B6B' }}
            >
              {getTxt('hashtag', '#DinahAndTzeRen2025')}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div 
        className="border-t py-6"
        style={{ borderColor: 'rgba(166, 123, 91, 0.2)' }}
      >
        <div className="container-wedding flex flex-col md:flex-row justify-between items-center gap-4">
          <p 
            className="text-sm flex items-center gap-2"
            style={{ color: '#8B7B6B' }}
          >
            © {currentYear} {getTxt('couple_names', 'Dinah & Tze Ren')}. Made with 
            <Heart className="w-4 h-4 fill-current" style={{ color: '#D4A59A' }} /> 
            in {getTxt('location', 'Nairobi')}
          </p>
          <p 
            className="font-script text-lg"
            style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
          >
             {getTxt('message', 'Forever & Always')}
          </p>
        </div>
      </div>
    </footer>
  );
}
