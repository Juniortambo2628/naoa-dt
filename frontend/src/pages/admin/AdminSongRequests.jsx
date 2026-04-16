import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Check, Trash2, Clock, 
  Loader2, RefreshCw, X, PlayCircle
} from 'lucide-react';
import { songRequestService } from '../../services/api';
import AdminPageHero from '../../components/admin/AdminPageHero';
import StatCard from '../../components/admin/StatCard';
import AdminToolbar from '../../components/admin/AdminToolbar';
import { useSearch } from '../../context/SearchContext';

export default function AdminSongRequests() {
  const { t } = useTranslation();
  const [songs, setSongs] = useState([]);
  const [stats, setStats] = useState({ total: 0, played: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const { searchQuery } = useSearch();
  const [filter, setFilter] = useState('all');

  const fetchSongs = async () => {
    try {
      const res = await songRequestService.getAll();
      setSongs(res.data.songs || []);
      setStats(res.data.stats || { total: 0, played: 0, pending: 0 });
    } catch (err) {
      console.error('Failed to fetch songs', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSongs();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSongs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkPlayed = async (id) => {
    setProcessing(id);
    try {
      await songRequestService.markPlayed(id);
      fetchSongs();
    } catch (err) {
      console.error('Failed to update song', err);
    }
    setProcessing(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this request?')) return;
    
    setProcessing(id);
    try {
      await songRequestService.delete(id);
      fetchSongs();
    } catch (err) {
      console.error('Failed to delete song', err);
    }
    setProcessing(null);
  };

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Song Requests"
        description={`${songs.length} total requests from guests`}
        breadcrumb={[
          { label: 'Dashboard', path: '/admin/dashboard' },
          { label: 'Songs' },
        ]}
        icon={<Music className="w-5 h-5 text-[#A67B5B]" />}
        actions={
          <button 
            onClick={() => { setLoading(true); fetchSongs(); }}
            className="p-2 text-stone-500 hover:bg-stone-100 rounded-full transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Music className="w-6 h-6" />}
          label="Total Requests"
          value={stats.total}
          color="#A67B5B"
        />
        <StatCard 
          icon={<Clock className="w-6 h-6" />}
          label="Pending"
          value={stats.pending}
          color="#D4A59A"
        />
        <StatCard 
          icon={<Check className="w-6 h-6" />}
          label="Played"
          value={stats.played}
          color="#8B9A7D"
        />
      </div>

      <AdminToolbar
        onSearchChange={() => {}} // dummy to signal that we are using global search if component still checks it
        searchPlaceholder="Search songs or artists..."
        filters={[
          { id: 'all', label: 'All Requests' },
          { id: 'pending', label: 'Pending' },
          { id: 'played', label: 'Played' }
        ]}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      {/* Queue List */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        {loading && songs.length === 0 ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#A67B5B]" />
          </div>
        ) : songs.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            <Music className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No song requests yet</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            <AnimatePresence>
              {songs.filter(song => {
                const activeSearch = searchQuery || '';
                const searchLower = activeSearch.toLowerCase();
                const matchesSearch = (song.song_title && song.song_title.toLowerCase().includes(searchLower)) ||
                                      (song.artist && song.artist.toLowerCase().includes(searchLower)) ||
                                      (song.guest_name && song.guest_name.toLowerCase().includes(searchLower));
                const matchesFilter = filter === 'all' ? true : (filter === 'played' ? song.is_played : !song.is_played);
                return matchesSearch && matchesFilter;
              }).map((song) => (
                <motion.div
                  key={song.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`p-4 flex items-center gap-4 hover:bg-stone-50 transition-colors ${
                    song.is_played ? 'opacity-60 bg-stone-50' : ''
                  }`}
                >
                  {/* Status Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    song.is_played 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-orange-100 text-orange-600'
                  }`}>
                    {song.is_played ? <Check className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium truncate ${song.is_played ? 'text-stone-500 line-through' : 'text-stone-800'}`}>
                        {song.song_title}
                      </h3>
                      {song.song_data?.preview_url && (
                        <a 
                          href={song.song_data.preview_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#A67B5B] hover:text-[#8B6B4D]"
                          title="Listen Preview"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-stone-500 truncate">{song.artist}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-stone-400">
                      <span>Requested by: <span className="font-medium text-stone-600">{song.guest_name}</span></span>
                      <span>•</span>
                      <span>{song.requested_at}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!song.is_played && (
                      <button
                        onClick={() => handleMarkPlayed(song.id)}
                        disabled={processing === song.id}
                        className="btn-sm btn-secondary flex items-center gap-2"
                        title="Mark as Played"
                      >
                        {processing === song.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span className="hidden sm:inline">Played</span>
                          </>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(song.id)}
                      disabled={processing === song.id}
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
