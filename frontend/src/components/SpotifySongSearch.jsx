import { useState, useEffect, useRef } from 'react';
import { Search, Music, Play, Pause, X, Check } from 'lucide-react';
import api from '../services/api';

export default function SpotifySongSearch({ value, onChange, placeholder = "Search for a song..." }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [playingPreview, setPlayingPreview] = useState(null);
    const audioRef = useRef(null);
    const searchTimeout = useRef(null);

    useEffect(() => {
        // Parse existing value if it's a Spotify track
        if (value && value.startsWith('spotify:')) {
            const trackData = value.replace('spotify:', '');
            try {
                setSelectedTrack(JSON.parse(trackData));
            } catch (e) {
                // If not JSON, treat as plain text
            }
        }
    }, []);

    const searchSpotify = async (searchQuery) => {
        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const res = await api.get('/spotify/search', { params: { query: searchQuery } });
            if (res.data.success) {
                setResults(res.data.tracks);
            }
        } catch (err) {
            console.error('Spotify search failed', err);
            setResults([]);
        }
        setLoading(false);
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setShowResults(true);

        // Debounce search
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => searchSpotify(val), 300);
    };

    const selectTrack = (track) => {
        setSelectedTrack(track);
        setShowResults(false);
        setQuery('');
        // Store as JSON with spotify prefix for easy identification
        onChange(`spotify:${JSON.stringify(track)}`);
        stopPreview();
    };

    const clearSelection = () => {
        setSelectedTrack(null);
        onChange('');
        stopPreview();
    };

    const playPreview = (previewUrl, trackId) => {
        if (!previewUrl) return;
        
        if (playingPreview === trackId) {
            stopPreview();
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
        }

        audioRef.current = new Audio(previewUrl);
        audioRef.current.volume = 0.3;
        audioRef.current.play();
        audioRef.current.onended = () => setPlayingPreview(null);
        setPlayingPreview(trackId);
    };

    const stopPreview = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setPlayingPreview(null);
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => stopPreview();
    }, []);

    return (
        <div className="relative">
            <audio ref={audioRef} hidden />
            
            {/* Selected Track Display */}
            {selectedTrack ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                    {selectedTrack.image && (
                        <img 
                            src={selectedTrack.image} 
                            alt={selectedTrack.name}
                            className="w-12 h-12 rounded-lg object-cover"
                        />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-800 truncate">{selectedTrack.name}</p>
                        <p className="text-sm text-stone-500 truncate">{selectedTrack.artist}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedTrack.preview_url && (
                            <button
                                type="button"
                                onClick={() => playPreview(selectedTrack.preview_url, selectedTrack.id)}
                                className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                            >
                                {playingPreview === selectedTrack.id ? (
                                    <Pause className="w-4 h-4" />
                                ) : (
                                    <Play className="w-4 h-4" />
                                )}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="p-2 rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                /* Search Input */
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => query && setShowResults(true)}
                        onBlur={() => setTimeout(() => setShowResults(false), 200)}
                        placeholder={placeholder}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-stone-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all"
                    />
                    {loading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            )}

            {/* Search Results Dropdown */}
            {showResults && results.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-stone-200 max-h-80 overflow-y-auto">
                    {results.map((track) => (
                        <button
                            key={track.id}
                            type="button"
                            onClick={() => selectTrack(track)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-0"
                        >
                            {track.image ? (
                                <img 
                                    src={track.image} 
                                    alt={track.name}
                                    className="w-10 h-10 rounded object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded bg-stone-200 flex items-center justify-center">
                                    <Music className="w-5 h-5 text-stone-400" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0 text-left">
                                <p className="font-medium text-stone-800 truncate">{track.name}</p>
                                <p className="text-sm text-stone-500 truncate">{track.artist}</p>
                            </div>
                            {track.preview_url && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        playPreview(track.preview_url, track.id);
                                    }}
                                    className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors"
                                >
                                    {playingPreview === track.id ? (
                                        <Pause className="w-4 h-4" />
                                    ) : (
                                        <Play className="w-4 h-4" />
                                    )}
                                </button>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Spotify Branding */}
            <div className="flex items-center justify-end gap-1 mt-2">
                <span className="text-xs text-stone-400">Powered by</span>
                <svg className="w-16 h-5" viewBox="0 0 2362 709">
                    <path fill="#1DB954" d="M1794.3 532.8c-52.1-31-124.1-48.1-203.9-48.1-83.4 0-172.1 18.6-244.3 51.2-12.2 5.5-15.8 15-15.8 24.9 0 14.5 11.1 26.3 25.6 26.3 5.5 0 9.6-1.5 13.7-3.3 62.6-28.2 141.6-44.6 221.3-44.6 70.8 0 134.6 14.1 179.6 39.8 6.3 3.7 10.7 5.2 16.2 5.2 14.5 0 26.3-11.5 26.3-26.3-.1-11.6-6.4-20.1-18.7-25.1zm-203.9-148.5c-74.5 0-147.1 16.1-211.7 46.8-11.1 5.2-17.6 14.1-17.6 27.1 0 16.3 13.4 29.7 29.7 29.7 6.7 0 11.5-1.9 17.1-4.4 55.3-25.6 118.3-39.8 182.5-39.8 72.3 0 143.1 16.1 199.5 45.3 7.1 4.1 11.9 5.9 18.6 5.9 16.3 0 29.7-13.4 29.7-29.7 0-13-6.7-22.7-19.3-29.3-66.9-35.5-147.9-51.6-228.5-51.6zm316.5-50.2c0-15.2-7.8-26.7-22.3-34.2-78.6-45.3-180.6-66.5-294.2-66.5-88.6 0-179.5 17.2-254.6 53.1-13 6.3-20.8 17.2-20.8 32.7 0 18.9 15.2 34.2 34.2 34.2 7.8 0 13.7-2.2 20.1-5.2 64.3-29.7 143.9-44.6 221.3-44.6 101.2 0 193.1 19.7 259.1 56.8 6.7 3.7 12.2 5.2 19.3 5.2 18.9 0 37.9-15.2 37.9-31.5z"/>
                </svg>
            </div>
        </div>
    );
}
