import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, User, Camera, Play, Pause, ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { galleryService, contentService, getAssetUrl } from '../services/api';
import api from '../services/api';
import { 
  MainFlowerTopLeft, 
  MainFlowerBottomRight, 
  FlowerDivider,
} from '../components/CustomIllustrations';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import { Skeleton, CardSkeleton } from '../components/Skeleton';
import { useContent } from '../context/ContentContext';
import { Navigate } from 'react-router-dom';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

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

export default function Gallery() {
  const { t, i18n } = useTranslation();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { contents: content, loading: contentLoading, isVisible } = useContent();
  
  // Slideshow state
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideshowInterval = useRef(null);

  const fetchGallery = async () => {
    try {
      const response = await galleryService.getAll();
      setImages(response.data?.filter(img => img.is_visible) || []);
    } catch (err) {
      console.error('Failed to load gallery', err);
    }
    setLoading(false);
  };

  const navigate = useNavigate();

  useEffect(() => {
    fetchGallery();
    // Auto-refresh every 30 seconds for live updates
    const interval = setInterval(fetchGallery, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!contentLoading && !isVisible('gallery')) {
      navigate('/module-unavailable/gallery');
    }
  }, [contentLoading, isVisible, navigate]);


  // Slideshow controls
  const startSlideshow = () => {
    setSlideshowActive(true);
    setCurrentSlide(0);
    slideshowInterval.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % images.length);
    }, 5000); // 5 seconds per slide
  };

  const stopSlideshow = () => {
    setSlideshowActive(false);
    if (slideshowInterval.current) {
      clearInterval(slideshowInterval.current);
    }
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    return () => {
      if (slideshowInterval.current) {
        clearInterval(slideshowInterval.current);
      }
    };
  }, []);

  // File upload handling
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (contentLoading) {
    return <Loader />;
  }

  if (!isVisible('gallery')) {
    return null; // The useEffect will handle redirect
  }

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !guestName.trim()) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', uploadFile);
      formData.append('guest_name', guestName);
      formData.append('caption', ''); // Captions removed from UI but kept in API for compatibility

      await api.post('/gallery/guest-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadSuccess(true);
      fetchGallery();
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadPreview(null);
        setGuestName('');
        setUploadSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Upload failed', err);
    }
    setUploading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'linear-gradient(180deg, #FFF9F5 0%, #F8E8E0 100%)', minHeight: '100vh' }}
    >
      <Navbar />
      
      <main className="pt-32 pb-20 relative overflow-hidden">
        {/* Decorations */}
        <MainFlowerTopLeft size={250} />
        <MainFlowerBottomRight size={250} />
        
        <div className="container-wedding relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <FlowerDivider />
            <h1 
              className="text-5xl md:text-6xl mb-4"
              style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
            >
              {getContent(content, 'gallery', 'title', i18n, 'Our Gallery')}
            </h1>
            <p 
              className="text-lg mb-6"
              style={{ color: '#6B5D52', fontFamily: "'Cormorant Garamond', serif" }}
            >
              {getContent(content, 'gallery', 'subtitle', i18n, 'Cherished moments from our journey together')}
            </p>

            {/* Action Buttons hidden as per request */}
            {/* <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                {t('gallery.upload') || 'Share a Photo'}
              </button>
              {images.length > 0 && (
                <button
                  onClick={slideshowActive ? stopSlideshow : startSlideshow}
                  className="btn-secondary flex items-center gap-2"
                >
                  {slideshowActive ? (
                    <>
                      <Pause className="w-5 h-5" />
                      {t('gallery.stop_slideshow') || 'Stop Slideshow'}
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      {t('gallery.start_slideshow') || 'Start Slideshow'}
                    </>
                  )}
                </button>
              )}
            </div> */}
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-10">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="aspect-square">
                   <Skeleton variant="image" className="w-full h-full" height="100%" />
                </div>
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-20">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: '#A67B5B' }} />
              <p style={{ color: '#6B5D52' }}>{t('gallery.empty') || 'No photos yet. Be the first to share!'}</p>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {images.map((image, index) => (
                <motion.div
                  key={image.id || index}
                  variants={fadeInUp}
                  className="relative aspect-square overflow-hidden rounded-2xl cursor-pointer group"
                  onClick={() => setSelectedImage(image)}
                >
                    <img
                    src={getAssetUrl(image.image_url)}
                    alt="Gallery image"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    style={{ objectPosition: image.object_position || 'center' }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      {/* Captions removed as per request */}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && !slideshowActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={getAssetUrl(selectedImage.image_url)}
              alt="Gallery image"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {/* Captions removed as per request */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slideshow Modal */}
      <AnimatePresence>
        {slideshowActive && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          >
            <button
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
              onClick={stopSlideshow}
            >
              <X className="w-8 h-8" />
            </button>
            
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-10"
              onClick={prevSlide}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-10"
              onClick={nextSlide}
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            <AnimatePresence mode="wait">
              <motion.img
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                src={getAssetUrl(images[currentSlide]?.image_url)}
                alt="Slideshow"
                className="max-w-full max-h-full object-contain"
              />
            </AnimatePresence>

            {/* Slide info */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-center">
              <p className="text-sm opacity-50 mt-4">
                {currentSlide + 1} / {images.length}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 
                  className="text-2xl"
                  style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
                >
                  {t('gallery.share_photo') || 'Share a Photo'}
                </h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {uploadSuccess ? (
                <div className="text-center py-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center"
                  >
                    <Check className="w-8 h-8 text-green-600" />
                  </motion.div>
                  <p className="text-lg font-medium" style={{ color: '#4A3F35' }}>
                    {t('gallery.upload_success') || 'Photo shared successfully!'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleUpload} className="space-y-5">
                  {/* Image Preview/Upload */}
                  <div>
                    {uploadPreview ? (
                      <div className="relative">
                        <img
                          src={uploadPreview}
                          alt="Preview"
                          className="w-full aspect-video object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setUploadFile(null);
                            setUploadPreview(null);
                          }}
                          className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="block border-2 border-dashed border-stone-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#A67B5B] transition-colors">
                        <Camera className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: '#A67B5B' }} />
                        <p style={{ color: '#6B5D52' }}>
                          {t('gallery.tap_to_upload') || 'Tap to select a photo'}
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="input-label flex items-center gap-2">
                      <User className="w-4 h-4" style={{ color: '#A67B5B' }} />
                      {t('gallery.your_name') || 'Your Name'}
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="input-field"
                      placeholder={t('gallery.name_placeholder') || 'Enter your name'}
                      required
                    />
                  </div>



                  <button
                    type="submit"
                    disabled={uploading || !uploadFile || !guestName.trim()}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        {t('gallery.upload_button') || 'Share Photo'}
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </motion.div>
  );
}
