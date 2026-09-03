import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, Clock } from 'lucide-react';
import { polaroidService } from '../services/api';
import { getAssetUrl } from '../utils/assetUrl';
import { useSmartPolling } from '../hooks/useSmartPolling';

function PolaroidCard({ image, index }) {
    const [loaded, setLoaded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, rotate: -2 + (index % 5) }}
            animate={{ opacity: 1, y: 0, rotate: -2 + (index % 5) }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
            className="relative break-inside-avoid mb-4"
        >
            <div 
                className="bg-white rounded-sm p-2 pb-8 shadow-lg"
                style={{ 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
                }}
            >
                <div className="relative overflow-hidden rounded-sm bg-stone-100 aspect-square">
                    {!loaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-stone-300 animate-pulse" />
                        </div>
                    )}
                    <img
                        src={getAssetUrl(image.full_image_url || image.image_path)}
                        alt={image.title || image.caption || 'Polaroid'}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setLoaded(true)}
                        loading="lazy"
                    />
                </div>
                
                {(image.title || image.caption) && (
                    <div className="mt-2 px-1">
                        {image.title && (
                            <p className="text-xs font-medium text-stone-700 truncate">{image.title}</p>
                        )}
                        {image.caption && (
                            <p className="text-[10px] text-stone-400 truncate">{image.caption}</p>
                        )}
                    </div>
                )}
                
                {image.location && (
                    <div className="absolute bottom-1.5 right-2 flex items-center gap-0.5 text-[9px] text-stone-400">
                        <MapPin className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[60px]">{image.location}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default function PolaroidFeed() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchImages = async () => {
        try {
            const res = await polaroidService.getAll();
            setImages(res.data || []);
            return res.data || [];
        } catch (err) {
            console.error('Failed to fetch polaroid images', err);
            return [];
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const { hasNewItems } = useSmartPolling(fetchImages, {
        fastInterval: 8000,
        slowInterval: 30000,
        idleAfterMs: 120000,
        onNewItems: (newItems) => {
            setImages(prev => {
                const existingIds = new Set(prev.map(i => i.id));
                const fresh = newItems.filter(i => !existingIds.has(i.id));
                return fresh.length ? [...fresh, ...prev] : prev;
            });
        },
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Camera className="w-8 h-8 text-stone-300 animate-pulse" />
            </div>
        );
    }

    if (!images.length) return null;

    const groupedByDate = images.reduce((acc, img) => {
        const dateKey = img.taken_at 
            ? new Date(img.taken_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : 'Captured Moments';
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(img);
        return acc;
    }, {});

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            className="mt-16"
        >
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
                    style={{ background: 'rgba(166, 123, 91, 0.1)' }}
                >
                    <Camera className="w-4 h-4" style={{ color: '#A67B5B' }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#A67B5B' }}>
                        Live from the Event
                    </span>
                    {hasNewItems && (
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="New photos arrived" />
                    )}
                </div>
                <h2 
                    className="text-3xl md:text-4xl"
                    style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
                >
                    Captured Moments
                </h2>
            </div>

            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 max-w-5xl mx-auto">
                <AnimatePresence>
                    {Object.entries(groupedByDate).map(([date, imgs]) => (
                        <div key={date} className="break-inside-avoid mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="w-3 h-3 text-stone-400" />
                                <span className="text-xs font-medium text-stone-500">{date}</span>
                            </div>
                            {imgs.map((img, i) => (
                                <PolaroidCard key={img.id} image={img} index={i} />
                            ))}
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
