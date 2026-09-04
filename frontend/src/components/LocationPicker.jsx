import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { Search, MapPin, X, Loader2 } from 'lucide-react';

function createPinIcon() {
  return divIcon({
    className: '',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
    html: `<div style="width:32px;height:40px;display:flex;align-items:flex-start;justify-content:center;">
      <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z" fill="#A67B5B"/>
        <circle cx="16" cy="14" r="6" fill="white"/>
      </svg>
    </div>`,
  });
}

const pinIcon = createPinIcon();

function FlyTo({ center }) {
  const _map = useMap();
  useEffect(() => {
    if (center && _map) {
      _map.flyTo(center, 15, { duration: 1.2 });
    }
  }, [center, _map]);
  return null;
}

function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function DraggableMarker({ position, onDragEnd }) {
  return (
    <Marker
      position={position}
      icon={pinIcon}
      draggable
      eventHandlers={{
        dragend(e) {
          const { lat, lng } = e.target.getLatLng();
          onDragEnd([lat, lng]);
        },
      }}
    />
  );
}

export default function LocationPicker({ lat, lng, onChange }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const position = lat && lng ? [parseFloat(lat), parseFloat(lng)] : [-1.2921, 36.8219];

  const searchNominatim = useCallback(async (q) => {
    if (!q || q.length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`,
        { headers: { 'Accept': 'application/json' } }
      );
      const data = await res.json();
      setSuggestions(data);
      setShowDropdown(true);
    } catch {
      setSuggestions([]);
    }
    setSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchNominatim(query), 500);
    return () => clearTimeout(debounceRef.current);
  }, [query, searchNominatim]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    const latStr = item.lat;
    const lngStr = item.lon;
    const label = item.display_name.length > 60
      ? item.display_name.substring(0, 60) + '...'
      : item.display_name;
    setQuery(label);
    setSelectedLabel(item.display_name);
    setShowDropdown(false);
    setSuggestions([]);
    onChange(latStr, lngStr);
  };

  const handleMapClick = (pos) => {
    onChange(String(pos[0].toFixed(6)), String(pos[1].toFixed(6)));
    setSelectedLabel('');
    setQuery(`${pos[0].toFixed(6)}, ${pos[1].toFixed(6)}`);
  };

  const handleDragEnd = (pos) => {
    onChange(String(pos[0].toFixed(6)), String(pos[1].toFixed(6)));
    setSelectedLabel('');
    setQuery(`${pos[0].toFixed(6)}, ${pos[1].toFixed(6)}`);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedLabel('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedLabel('');
            }}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder="Search venue location (e.g. 'Karen Nairobi' or 'Uhuru Gardens')"
            className="w-full pl-10 pr-10 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A67B5B] animate-spin" />
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-stone-100 py-1 max-h-64 overflow-y-auto">
            {suggestions.map((item, i) => (
              <button
                key={`${item.place_id}-${i}`}
                onClick={() => handleSelect(item)}
                className="w-full px-4 py-3 text-left hover:bg-[#FAF7F2] transition-colors flex items-start gap-3"
              >
                <MapPin className="w-4 h-4 text-[#A67B5B] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-700 truncate">{item.display_name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {parseFloat(item.lat).toFixed(4)}, {parseFloat(item.lon).toFixed(4)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-stone-200" style={{ height: 280 }}>
        <MapContainer
          center={position}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <DraggableMarker position={position} onDragEnd={handleDragEnd} />
          <MapClickHandler onClick={handleMapClick} />
          <FlyTo center={position} />
        </MapContainer>
      </div>

      {/* Coordinates Display */}
      <div className="flex items-center gap-2 text-xs text-stone-500">
        <MapPin className="w-3.5 h-3.5 text-[#A67B5B]" />
        <span>
          <strong>{lat || '—'}</strong>, <strong>{lng || '—'}</strong>
        </span>
        <span className="text-stone-400">— Drag marker or click map to adjust</span>
      </div>

      {/* Selected address preview */}
      {selectedLabel && (
        <p className="text-xs text-stone-400 italic truncate">{selectedLabel}</p>
      )}
    </div>
  );
}
