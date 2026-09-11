import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, RefreshCw, Filter } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { guestService } from '../services/api';
import { useSmartPolling } from '../hooks/useSmartPolling';

// Custom marker icons by group
const createIcon = (group = 'default') => {
  const colors = {
    family: '#f43f5e',
    friends: '#3b82f6',
    colleagues: '#10b981',
    vip: '#f59e0b',
    default: '#A67B5B',
  };
  
  const color = colors[group?.toLowerCase()] || colors.default;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 32px;
      height: 32px;
      background: ${color};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-16px, -16px);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Zone markers for predefined areas
const ZONE_MARKERS = [
  { id: 'entrance', name: 'Entrance', position: [0, 0], icon: '🚪' },
  { id: 'ceremony', name: 'Ceremony', position: [0, 0], icon: '💒' },
  { id: 'reception', name: 'Reception', position: [0, 0], icon: '🥂' },
  { id: 'dance-floor', name: 'Dance Floor', position: [0, 0], icon: '💃' },
  { id: 'bar', name: 'Bar', position: [0, 0], icon: '🍸' },
  { id: 'food', name: 'Food', position: [0, 0], icon: '🍽️' },
];

function LocationLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-xl shadow-lg p-3">
      <p className="text-xs font-semibold text-stone-600 mb-2">Guest Groups</p>
      <div className="space-y-1.5">
        {[
          { group: 'family', color: '#f43f5e', label: 'Family' },
          { group: 'friends', color: '#3b82f6', label: 'Friends' },
          { group: 'colleagues', color: '#10b981', label: 'Colleagues' },
          { group: 'vip', color: '#f59e0b', label: 'VIP' },
          { group: 'default', color: '#A67B5B', label: 'Other' },
        ].map((item) => (
          <div key={item.group} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-stone-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapBoundsUpdater({ guests }) {
  const map = useMap();
  
  useEffect(() => {
    if (guests.length > 0) {
      const bounds = L.latLngBounds(
        guests
          .filter(g => g.location_lat && g.location_lng)
          .map(g => [g.location_lat, g.location_lng])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [guests, map]);
  
  return null;
}

export default function GuestLocationMap({ embedded = false }) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupFilter, setGroupFilter] = useState('all');
  const [venueCoords, setVenueCoords] = useState([-3.0, 101.5]);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await guestService.getLocations();
      setGuests(res.data || []);
      return res.data || [];
    } catch (err) {
      console.error('Failed to fetch guest locations', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Fetch venue settings for center
  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const { settingService } = await import('../services/api');
        const res = await settingService.getAll();
        if (res.data?.venue_lat && res.data?.venue_lng) {
          setVenueCoords([parseFloat(res.data.venue_lat), parseFloat(res.data.venue_lng)]);
        }
      } catch (err) {
        console.error('Failed to fetch venue settings', err);
      }
    };
    fetchVenue();
  }, []);

  // Smart polling for real-time updates
  const { hasNewItems } = useSmartPolling(fetchLocations, {
    fastInterval: 15000,
    slowInterval: 30000,
    idleAfterMs: 120000,
    onNewItems: (newItems) => {
      setGuests(newItems);
    },
  });

  // Filter guests
  const filteredGuests = guests.filter(guest => {
    if (groupFilter === 'all') return true;
    return guest.group?.toLowerCase() === groupFilter;
  });

  // Guests with GPS coordinates
  const guestsWithCoords = filteredGuests.filter(g => g.location_lat && g.location_lng);
  
  // Guests with zone only
  const guestsWithZone = filteredGuests.filter(g => g.location_zone && !g.location_lat);

  // Stats
  const stats = {
    total: filteredGuests.length,
    withGps: guestsWithCoords.length,
    withZone: guestsWithZone.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Users className="w-8 h-8 text-stone-300 animate-pulse" />
          <p className="text-sm text-stone-400">Loading guest locations...</p>
        </div>
      </div>
    );
  }

  const mapContent = (
    <div className="relative">
      {/* Map */}
      <div className="h-[500px] rounded-2xl overflow-hidden border border-stone-200">
        <MapContainer
          center={venueCoords}
          zoom={16}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {guestsWithCoords.map((guest) => (
            <Marker
              key={guest.id}
              position={[guest.location_lat, guest.location_lng]}
              icon={createIcon(guest.group)}
            >
              <Popup>
                <div className="text-center p-1">
                  <p className="font-semibold text-stone-800">{guest.name}</p>
                  <p className="text-xs text-stone-500 capitalize">{guest.group || 'Guest'}</p>
                  {guest.table_name && (
                    <p className="text-xs text-stone-400">Table {guest.table_name}</p>
                  )}
                  <p className="text-[10px] text-stone-400 mt-1">
                    📍 Updated {new Date(guest.location_updated_at).toLocaleTimeString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
          
          <MapBoundsUpdater guests={guestsWithCoords} />
        </MapContainer>
        
        <LocationLegend />
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#A67B5B]" />
            <span className="text-sm text-stone-600">{stats.total} guests sharing location</span>
          </div>
          <div className="text-sm text-stone-400">
            {stats.withGps} GPS • {stats.withZone} zone only
          </div>
        </div>
        
        <button
          onClick={fetchLocations}
          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-stone-400" />
        </button>
      </div>

      {/* Zone-only guests list */}
      {guestsWithZone.length > 0 && (
        <div className="mt-4 p-4 bg-stone-50 rounded-xl">
          <p className="text-xs font-semibold text-stone-500 mb-2">Guests by Zone (no GPS)</p>
          <div className="flex flex-wrap gap-2">
            {guestsWithZone.map((guest) => (
              <span
                key={guest.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-stone-600 border border-stone-200"
              >
                <span className="font-medium">{guest.name.split(' ')[0]}</span>
                <span className="text-stone-400">at</span>
                <span className="text-[#A67B5B]">{guest.location_zone}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Embedded view
  if (embedded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800 text-lg">Guest Locations</h3>
              <p className="text-sm text-stone-400">Real-time guest positions</p>
            </div>
          </div>
          
          {/* Filter */}
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 bg-white"
          >
            <option value="all">All Groups</option>
            <option value="family">Family</option>
            <option value="friends">Friends</option>
            <option value="colleagues">Colleagues</option>
            <option value="vip">VIP</option>
          </select>
        </div>
        
        {mapContent}
      </motion.div>
    );
  }

  // Full page view
  return (
    <div className="space-y-6">
      {mapContent}
    </div>
  );
}
