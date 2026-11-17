import Overlay from '../components/Overlay';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, User, Camera, Play, Pause, ChevronLeft, ChevronRight, Check, Smartphone, Download } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { galleryService, getAssetUrl } from '../services/api';
import api from '../services/api';
import { 
  MainFlowerTopLeft, 
  MainFlowerBottomRight, 
} from '../components/CustomIllustrations';
import Loader from '../components/Loader';
import Button from '../components/Button';
import { Skeleton, CardSkeleton } from '../components/Skeleton';
import { useContent } from '../context/ContentContext';
import { Navigate } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import StickyPageHeader from '../components/StickyPageHeader';
import { gallerySections, thumbOf } from '../utils/galleryAlbums';
import { isAfterWedding } from '../utils/weddingPhase';

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
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Camera capture state
  const [showCamera, setShowCamera] = useState(false);
  const { contents: content, settings, loading: contentLoading, isVisible } = useContent();
  // After the wedding the page is the wedding photos, whatever it was called before.
  const after = !contentLoading && isAfterWedding(settings, content);
  
  // Slideshow state
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideshowInterval = useRef(null);
  // The gallery in story order: the Ayie, then the wedding, then more, then guests' photos.
  const sections = gallerySections(images, albums);
  const ordered = sections.flatMap((section) => section.items);
  const selectedIndex = selectedImage ? ordered.findIndex((img) => img.id === selectedImage.id) : -1;
  const step = (delta) => {
    if (selectedIndex < 0 || !ordered.length) return;
    setSelectedImage(ordered[(selectedIndex + delta + ordered.length) % ordered.length]);
  };

  const fetchGallery = async () => {
    try {
      const [response, albumRes] = await Promise.all([
        galleryService.getAll(),
        galleryService.getAlbums().catch(() => ({ data: [] })),
      ]);
      setImages(response.data?.filter(img => img.is_visible) || []);
      setAlbums(Array.isArray(albumRes?.data) ? albumRes.data : []);
    } catch (err) {
      console.error('Failed to load gallery', err);
    }
    setLoading(false);
  };

  const navigate = useNavigate();
  const location = useLocation();

  // From the invitation: "Share your photos" opens the upload straight away.
  useEffect(() => {
    if (new URLSearchParams(location.search).get('share')) setShowUploadModal(true);
  }, [location.search]);

  // "#album-2" links land on that album once the photos are in.
  useEffect(() => {
    if (loading || !location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, location.hash]);

  useEffect(() => {
    fetchGallery();
    // Pick up new photos every couple of minutes
    const interval = setInterval(fetchGallery, 120000);
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
      setCurrentSlide(prev => (prev + 1) % ordered.length);
    }, 5000); // 5 seconds per slide
  };

  const stopSlideshow = () => {
    setSlideshowActive(false);
    if (slideshowInterval.current) {
      clearInterval(slideshowInterval.current);
    }
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % ordered.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + ordered.length) % ordered.length);
  };

  // Arrow keys move through the photos in the viewer.
  useEffect(() => {
    if (!selectedImage) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

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

  // Camera capture handling
  const handleCameraCapture = (file) => {
    setUploadFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setShowCamera(false);
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
      style={{ background: 'linear-gradient(180deg, #FDFAF5 0%, #F3EBDF 100%)', minHeight: '100vh' }}
    >
      
      <main className="pt-32 pb-20 relative overflow-x-clip">
        {/* Decorations */}
        <MainFlowerTopLeft size={250} />
        <MainFlowerBottomRight size={250} />
        
        <div className="container-wedding relative z-10">
          <StickyPageHeader
            title={after
              ? getContent(content, 'gallery', 'title_after', i18n, 'Our Wedding Photos')
              : getContent(content, 'gallery', 'title', i18n, 'Our Gallery')}
            subtitle={after
              ? getContent(content, 'gallery', 'subtitle_after', i18n, 'From the Ayie to the wedding day')
              : getContent(content, 'gallery', 'subtitle', i18n, 'Cherished moments from our journey together')}
          />
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2 mb-12">
            <Button variant="secondary" size="lg" icon={Upload} onClick={() => setShowUploadModal(true)}>
              {t('gallery.upload') || 'Share a Photo'}
            </Button>
            {images.length > 0 && (
              <Button
                size="lg"
                icon={slideshowActive ? Pause : Play}
                onClick={slideshowActive ? stopSlideshow : startSlideshow}
              >
                {slideshowActive
                  ? t('gallery.stop_slideshow') || 'Stop Slideshow'
                  : t('gallery.start_slideshow') || 'Start Slideshow'}
              </Button>
            )}
          </div>

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
            <div className="space-y-16">
              {/* Jump between albums */}
              {sections.length > 1 && (
                <nav aria-label="Albums" className="flex flex-wrap justify-center gap-2 -mt-4">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="rounded-full border border-[#E4D6C2] bg-white/80 px-4 py-2 text-sm text-stone-700 hover:bg-white"
                    >
                      {section.title} <span className="text-stone-400">· {section.items.length}</span>
                    </a>
                  ))}
                </nav>
              )}

              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-40" aria-labelledby={`${section.id}-title`}>
                  {(sections.length > 1 || section.album) && (
                    <div className="text-center mb-6">
                      <h2 id={`${section.id}-title`} className="font-serif text-3xl md:text-4xl" style={{ color: '#4A3F35' }}>{section.title}</h2>
                      {section.subtitle && <p className="mt-1 text-sm uppercase tracking-[0.2em]" style={{ color: '#8B7B6B' }}>{section.subtitle}</p>}
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                    {section.items.map((image) => (
                      <button
                        type="button"
                        key={image.id}
                        className="relative aspect-square overflow-hidden rounded-xl md:rounded-2xl group bg-[#EFE6D8]"
                        onClick={() => setSelectedImage(image)}
                        aria-label={`Open photo${image.uploaded_by ? ` shared by ${image.uploaded_by}` : ''}`}
                      >
                        <img
                          src={getAssetUrl(thumbOf(image))}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          style={{ objectPosition: image.object_position || 'center' }}
                          loading="lazy"
                          decoding="async"
                        />
                        {image.is_guest_upload && image.uploaded_by && (
                          <span className="absolute bottom-2 left-2 right-2 truncate rounded-full bg-black/45 px-2 py-0.5 text-left text-[11px] text-white backdrop-blur-sm">
                            {image.uploaded_by}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && !slideshowActive && (
          <Overlay onClose={() => setSelectedImage(null)} backdropClassName="bg-black/90">
            <button
              aria-label="Close image"
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-8 h-8" />
            </button>
            {ordered.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full z-10"
                  onClick={(e) => { e.stopPropagation(); step(-1); }}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full z-10"
                  onClick={(e) => { e.stopPropagation(); step(1); }}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
            <img
              src={getAssetUrl(selectedImage.image_url)}
              alt="Gallery photo"
              className="max-w-full max-h-[82vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => { e.currentTarget.dataset.x = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                const dx = e.changedTouches[0].clientX - Number(e.currentTarget.dataset.x || 0);
                if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
              }}
            />
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3 text-white" onClick={(e) => e.stopPropagation()}>
              <span className="text-sm opacity-70">{selectedIndex + 1} / {ordered.length}</span>
              <a
                href={getAssetUrl(selectedImage.image_url)}
                download={selectedImage.original_name || 'Dinah-Tze-Ren-wedding.jpg'}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm hover:bg-white/25"
              >
                <Download className="w-4 h-4" /> Save photo
              </a>
            </div>
          </Overlay>
        )}
      </AnimatePresence>

      {/* Slideshow Modal */}
      <AnimatePresence>
        {slideshowActive && ordered.length > 0 && (
          <Overlay onClose={stopSlideshow} backdropClassName="bg-black" className="flex items-center justify-center" closeOnBackdrop={false}>
            <button
              aria-label="Close slideshow"
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
              onClick={stopSlideshow}
            >
              <X className="w-8 h-8" />
            </button>
            
            <button
              aria-label="Previous photo"
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-10"
              onClick={prevSlide}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            
            <button
              aria-label="Next photo"
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
                src={getAssetUrl(ordered[currentSlide]?.image_url)}
                alt="Slideshow"
                className="max-w-full max-h-full object-contain"
              />
            </AnimatePresence>

            {/* Slide info */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-center">
              <p className="text-sm opacity-50 mt-4">
                {currentSlide + 1} / {ordered.length}
              </p>
            </div>
          </Overlay>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <Overlay onClose={() => setShowUploadModal(false)}>
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
                  aria-label="Close"
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
                          aria-label="Remove photo"
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
                      <div className="space-y-3">
                        {/* Camera capture button */}
                        <button
                          type="button"
                          onClick={() => setShowCamera(true)}
                          className="w-full flex items-center justify-center gap-3 border-2 border-dashed border-stone-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#A67B5B] hover:bg-stone-50 transition-colors"
                        >
                          <Smartphone className="w-8 h-8" style={{ color: '#A67B5B' }} />
                          <div className="text-left">
                            <p className="font-medium" style={{ color: '#6B5D52' }}>
                              {t('gallery.take_photo') || 'Take a Photo'}
                            </p>
                            <p className="text-xs text-stone-500">
                              {t('gallery.use_camera') || 'Use your device camera'}
                            </p>
                          </div>
                        </button>
                        
                        {/* Divider */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 border-t border-stone-200" />
                          <span className="text-xs text-stone-400">{t('gallery.or') || 'or'}</span>
                          <div className="flex-1 border-t border-stone-200" />
                        </div>
                        
                        {/* File upload button */}
                        <label className="block border-2 border-dashed border-stone-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#A67B5B] hover:bg-stone-50 transition-colors">
                          <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" style={{ color: '#A67B5B' }} />
                          <p className="font-medium" style={{ color: '#6B5D52' }}>
                            {t('gallery.choose_from_gallery') || 'Choose from Gallery'}
                          </p>
                          <p className="text-xs text-stone-500">
                            {t('gallery.select_existing') || 'Select an existing photo'}
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="gallery-name" className="input-label flex items-center gap-2">
                      <User className="w-4 h-4" style={{ color: '#A67B5B' }} />
                      {t('gallery.your_name') || 'Your Name'}
                    </label>
                    <input
                      id="gallery-name"
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="input-field"
                      placeholder={t('gallery.name_placeholder') || 'Enter your name'}
                      required
                    />
                  </div>



                  <Button
                    type="submit"
                    variant="secondary"
                    size="lg"
                    fullWidth
                    icon={Upload}
                    loading={uploading}
                    disabled={!uploadFile || !guestName.trim()}
                  >
                    {t('gallery.upload_button') || 'Share Photo'}
                  </Button>
                </form>
              )}
            </motion.div>
          </Overlay>
        )}
      </AnimatePresence>

      {/* Camera Capture Modal */}
      <AnimatePresence>
        {showCamera && (
          <CameraCapture
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
            aspectRatio="4:3"
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
}
