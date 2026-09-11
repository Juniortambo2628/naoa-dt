import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
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
      width: 28px;
      height: 28px;
      background: ${color};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-14px, -14px);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

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

export default function PublicGuestMap({ venueCoords = [-1.2921, 36.8219] }) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = useCallback(async () => {
    try {
      // Use the public endpoint (no auth required)
      const res = await api.get('/guests/locations');
      const data = res.data?.data || res.data || [];
      setGuests(data);
      return data;
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

  // Smart polling for real-time updates
  const { hasNewItems } = useSmartPolling(fetchLocations, {
    fastInterval: 15000,
    slowInterval: 30000,
    idleAfterMs: 120000,
    onNewItems: (newItems) => {
      setGuests(newItems);
    },
  });

  // Guests with GPS coordinates
  const guestsWithCoords = guests.filter(g => g.location_lat && g.location_lng);

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

  if (guestsWithCoords.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 text-center"
      >
        <MapPin className="w-12 h-12 mx-auto mb-3 text-stone-300" />
        <h3 className="font-semibold text-stone-800 mb-2">Guest Map</h3>
        <p className="text-sm text-stone-400">
          No guests have shared their location yet. Be the first!
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800">Guest Map</h3>
              <p className="text-xs text-stone-400">
                {guestsWithCoords.length} guest{guestsWithCoords.length !== 1 ? 's' : ''} sharing location
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLocations}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-stone-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-[350px] md:h-[400px]">
        <MapContainer
          center={venueCoords}
          zoom={15}
          className="h-full w-full"
          zoomControl={false}
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
                  <p className="font-semibold text-stone-800">{guest.name?.split(' ')[0]}</p>
                  <p className="text-xs text-stone-500 capitalize">{guest.group || 'Guest'}</p>
                  {guest.table_name && (
                    <p className="text-xs text-stone-400">Table {guest.table_name}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
          
          <MapBoundsUpdater guests={guestsWithCoords} />
        </MapContainer>
      </div>

      {/* Guest list */}
      {guestsWithCoords.length > 0 && (
        <div className="p-4 border-t border-stone-100">
          <p className="text-xs font-medium text-stone-500 mb-2">Guests on map</p>
          <div className="flex flex-wrap gap-2">
            {guestsWithCoords.map((guest) => (
              <span
                key={guest.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-stone-50 rounded-full text-xs text-stone-600"
              >
                <span className="w-2 h-2 rounded-full bg-[#A67B5B]" />
                {guest.name?.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
