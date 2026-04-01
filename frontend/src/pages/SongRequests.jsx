import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Check, User, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { contentService } from '../services/api';
import api from '../services/api';
import SpotifySongSearch from '../components/SpotifySongSearch';
import { 
  MainFlowerTopLeft, 
  MainFlowerBottomRight, 
  FlowerDivider,
} from '../components/CustomIllustrations';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Skeleton } from '../components/Skeleton';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  },
};

export default function SongRequests() {
  const { t } = useTranslation();
  const [guestName, setGuestName] = useState('');
  const [songValue, setSongValue] = useState('');
  const [songs, setSongs] = useState([]);
  const [stats, setStats] = useState({ total: 0, played: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [content, setContent] = useState({});

  const fetchSongs = useCallback(async () => {
    try {
      const res = await api.get('/song-requests');
      setSongs(res.data.songs || []);
      setStats(res.data.stats || { total: 0, played: 0, pending: 0 });
    } catch (err) {
      console.error('Failed to fetch songs', err);
    }
    setLoading(false);
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    fetchSongs();
    const fetchContentAndCheckVisibility = async () => {
      try {
        const res = await contentService.getAll();
        const data = res.data || {};
        
        // If the section is explicitly hidden, redirect to home
        if (data['songs_page']?.is_visible === false) {
           navigate('/');
           return;
        }
        
        setContent(data);
      } catch (err) {
        console.error('Failed to load content', err);
      }
    };
    fetchContentAndCheckVisibility();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSongs, 30000);
    return () => clearInterval(interval);
  }, [fetchSongs, navigate]);

  useEffect(() => {
    if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
    } else {
        setError(null);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim() || !songValue) return;

    // Parse the song data from the SpotifySongSearch value
    let songData;
    try {
      if (songValue.startsWith('spotify:')) {
        songData = JSON.parse(songValue.replace('spotify:', ''));
      } else {
        // Manual text entry fallback
        songData = { name: songValue, artist: 'Unknown' };
      }
    } catch {
      songData = { name: songValue, artist: 'Unknown' };
    }

    setSubmitting(true);
    try {
      await api.post('/song-requests', {
        guest_name: guestName,
        song_data: songData,
      });
      setSuccess(true);
      setError(null);
      setGuestName('');
      setSongValue('');
      fetchSongs();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to submit', err);
      if (err.response?.status === 429) {
          setError(err.response.data.message);
          setTimeLeft(err.response.data.seconds_left || 3600);
      } else {
          setError('Failed to submit request. Please try again.');
      }
    }
    setSubmitting(false);
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
              {t('songs.title') || 'Request a Song'}
            </h1>
            <p 
              className="text-lg"
              style={{ color: '#6B5D52', fontFamily: "'Cormorant Garamond', serif" }}
            >
              {t('songs.subtitle') || 'Help us create the perfect playlist for our celebration'}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Request Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card-elevated"
            >
              <h2 
                className="text-2xl mb-6"
                style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
              >
                {t('songs.make_request') || 'Make a Request'}
              </h2>

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl flex items-center gap-3"
                  style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
                >
                  <Check className="w-5 h-5" />
                  <span>{t('songs.success') || 'Song added to the queue!'}</span>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl flex items-center justify-between gap-3 bg-red-50 text-red-600 border border-red-100"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                  {timeLeft > 0 && (
                      <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-mono font-bold">
                          {formatTime(timeLeft)}
                      </div>
                  )}
                </motion.div>
              )}


              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="input-label flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: '#A67B5B' }} />
                    {t('songs.your_name') || 'Your Name'}
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="input-field"
                    placeholder={t('songs.name_placeholder') || 'Enter your name'}
                    required
                  />
                </div>

                <div>
                  <label className="input-label flex items-center gap-2">
                    <Music className="w-4 h-4" style={{ color: '#A67B5B' }} />
                    {t('songs.search_song') || 'Search for a Song'}
                  </label>
                  <SpotifySongSearch
                    value={songValue}
                    onChange={setSongValue}
                    placeholder={t('songs.search_placeholder') || 'Search Spotify for a song...'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !guestName.trim() || !songValue}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Music className="w-5 h-5" />
                      {t('songs.submit') || 'Request Song'}
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Song Queue */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="card-elevated"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 
                  className="text-2xl"
                  style={{ fontFamily: "'Great Vibes', cursive", color: '#A67B5B' }}
                >
                  {t('songs.queue') || 'Song Queue'}
                </h2>
                <div className="flex items-center gap-4 text-sm" style={{ color: '#6B5D52' }}>
                  <span>{stats.pending} pending</span>
                  <span>{stats.played} played</span>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4 py-4">
                  {Array(4).fill(0).map((_, i) => <Skeleton key={i} variant="text" height="60px" />)}
                </div>
              ) : songs.length === 0 ? (
                <div className="text-center py-10" style={{ color: '#6B5D52' }}>
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>{t('songs.empty') || 'No songs requested yet. Be the first!'}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
                  <AnimatePresence>
                    {songs.map((song, index) => (
                      <motion.div
                        key={song.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-xl flex items-center gap-4 ${
                          song.is_played 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-stone-50 border border-stone-200'
                        }`}
                      >
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            song.is_played ? 'bg-green-500' : 'bg-gradient-to-br from-amber-500 to-orange-600'
                          }`}
                        >
                          {song.is_played ? <Check className="w-5 h-5" /> : index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-800 truncate">{song.song_title}</p>
                          <p className="text-sm text-stone-500 truncate">{song.artist}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-stone-400">{song.guest_name}</p>
                          <p className="text-xs text-stone-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {song.requested_at}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <Footer content={content} />
    </motion.div>
  );
}
