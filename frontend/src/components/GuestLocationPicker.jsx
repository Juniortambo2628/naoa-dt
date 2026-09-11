import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Check, Loader2, ChevronDown, X, Locate } from 'lucide-react';
import { guestService, settingService } from '../services/api';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom marker icon
const createIcon = (color = '#A67B5B') => L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 24px;
    height: 24px;
    background: ${color};
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
    "></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Predefined venue zones
const VENUE_ZONES = [
  { id: 'entrance', name: 'Entrance', icon: '🚪' },
  { id: 'ceremony', name: 'Ceremony Area', icon: '💒' },
  { id: 'reception', name: 'Reception', icon: '🥂' },
  { id: 'dance-floor', name: 'Dance Floor', icon: '💃' },
  { id: 'bar', name: 'Bar', icon: '🍸' },
  { id: 'food', name: 'Food Area', icon: '🍽️' },
  { id: 'photo-booth', name: 'Photo Booth', icon: '📸' },
  { id: 'garden', name: 'Garden', icon: '🌺' },
  { id: 'terrace', name: 'Terrace', icon: '🌅' },
  { id: 'parking', name: 'Parking', icon: '🅿️' },
];

function LocationMap({ position, onPositionChange }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {position && (
        <Marker 
          position={position} 
          icon={createIcon()}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const pos = marker.getLatLng();
              onPositionChange([pos.lat, pos.lng]);
            },
          }}
        />
      )}
    </>
  );
}

function GetCurrentLocationButton({ onLocate }) {
  const map = useMap();
  
  const handleClick = () => {
    map.locate({ enableHighAccuracy: true, timeout: 10000 });
    map.on('locationfound', (e) => {
      onLocate([e.latlng.lat, e.latlng.lng]);
    });
    map.on('locationerror', (e) => {
      alert('Unable to get your location. Please ensure GPS is enabled.');
    });
  };

  return (
    <button
      onClick={handleClick}
      className="absolute top-4 right-4 z-[1000] p-3 bg-white rounded-xl shadow-lg hover:bg-stone-50 transition-colors"
      title="Use my GPS location"
    >
      <Locate className="w-5 h-5 text-[#A67B5B]" />
    </button>
  );
}

export default function GuestLocationPicker({ guestCode, onSuccess }) {
  const [selectedZone, setSelectedZone] = useState(null);
  const [gpsPosition, setGpsPosition] = useState(null);
  const [useGps, setUseGps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [venueCoords, setVenueCoords] = useState([-3.0, 101.5]); // Default
  const [currentLocation, setCurrentLocation] = useState(null);

  // Fetch venue coordinates
  useEffect(() => {
    const fetchVenue = async () => {
      try {
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

  // Fetch current guest location if exists
  useEffect(() => {
    if (!guestCode) return;
    const fetchGuest = async () => {
      try {
        const res = await guestService.getByCode(guestCode);
        if (res.data?.location_zone) {
          setSelectedZone(res.data.location_zone);
        }
        if (res.data?.location_lat && res.data?.location_lng) {
          setGpsPosition([res.data.location_lat, res.data.location_lng]);
          setCurrentLocation([res.data.location_lat, res.data.location_lng]);
        }
      } catch (err) {
        console.error('Failed to fetch guest location', err);
      }
    };
    fetchGuest();
  }, [guestCode]);

  const handleGpsPin = useCallback((position) => {
    setGpsPosition(position);
    setSelectedZone(null); // Clear zone selection when using GPS
  }, []);

  const handleUseGpsToggle = () => {
    if (!useGps) {
      // Enable GPS - try to get current position
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = [position.coords.latitude, position.coords.longitude];
            setGpsPosition(pos);
            setUseGps(true);
          },
          (err) => {
            setError('Unable to get your location. Please ensure GPS is enabled.');
            setTimeout(() => setError(null), 3000);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setError('Geolocation is not supported by your browser');
        setTimeout(() => setError(null), 3000);
      }
    } else {
      setUseGps(false);
      setGpsPosition(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedZone && !gpsPosition) {
      setError('Please select a zone or pin your GPS location');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = {
        location_zone: selectedZone,
        location_lat: gpsPosition?.[0] || null,
        location_lng: gpsPosition?.[1] || null,
      };

      await guestService.updateLocation(guestCode, data);
      setSuccess(true);
      setCurrentLocation(gpsPosition);
      
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update location');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A67B5B] to-[#C8A68E] flex items-center justify-center shadow-lg">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-800">Where are you?</h3>
            <p className="text-xs text-stone-400">Let others know your location</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-5">
        {/* Zone Selection */}
        <div>
          <p className="text-sm font-medium text-stone-600 mb-3">Quick Select Zone</p>
          <div className="grid grid-cols-2 gap-2">
            {VENUE_ZONES.map((zone) => (
              <button
                key={zone.id}
                onClick={() => {
                  setSelectedZone(zone.id === selectedZone ? null : zone.id);
                  setGpsPosition(null);
                  setUseGps(false);
                }}
                className={`
                  flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left
                  ${selectedZone === zone.id 
                    ? 'border-[#A67B5B] bg-[#A67B5B]/5' 
                    : 'border-stone-100 hover:border-stone-200 bg-white'}
                `}
              >
                <span className="text-xl">{zone.icon}</span>
                <span className={`text-sm ${selectedZone === zone.id ? 'font-medium text-[#A67B5B]' : 'text-stone-600'}`}>
                  {zone.name}
                </span>
                {selectedZone === zone.id && (
                  <Check className="w-4 h-4 text-[#A67B5B] ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-stone-200" />
          <span className="text-xs text-stone-400">or</span>
          <div className="flex-1 border-t border-stone-200" />
        </div>

        {/* GPS Pin Option */}
        <div>
          <button
            onClick={handleUseGpsToggle}
            className={`
              w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all
              ${useGps 
                ? 'border-green-500 bg-green-50' 
                : 'border-dashed border-stone-300 hover:border-[#A67B5B] hover:bg-stone-50'}
            `}
          >
            <Navigation className={`w-5 h-5 ${useGps ? 'text-green-600' : 'text-stone-400'}`} />
            <div className="text-left">
              <p className={`font-medium ${useGps ? 'text-green-700' : 'text-stone-700'}`}>
                {useGps ? 'GPS Location Active' : 'Pin my GPS location'}
              </p>
              <p className={`text-xs ${useGps ? 'text-green-600' : 'text-stone-400'}`}>
                {gpsPosition ? 'Drag marker to adjust' : 'Use device GPS for exact position'}
              </p>
            </div>
          </button>
        </div>

        {/* Map */}
        <AnimatePresence>
          {useGps && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 250 }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-xl"
            >
              <div className="relative h-[250px]">
                <MapContainer
                  center={gpsPosition || venueCoords}
                  zoom={16}
                  className="h-full w-full"
                  zoomControl={false}
                >
                  <LocationMap 
                    position={gpsPosition} 
                    onPositionChange={setGpsPosition} 
                  />
                  <GetCurrentLocationButton onLocate={handleGpsPin} />
                </MapContainer>
              </div>
              {gpsPosition && (
                <div className="p-3 bg-stone-50 text-xs text-stone-500">
                  <p>📍 {gpsPosition[0].toFixed(6)}, {gpsPosition[1].toFixed(6)}</p>
                  <p className="text-stone-400 mt-1">Drag the marker to adjust your position</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <p className="font-medium text-green-700">Location updated!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={loading || (!selectedZone && !gpsPosition)}
          className="w-full py-3 bg-gradient-to-r from-[#A67B5B] to-[#C8A68E] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <MapPin className="w-5 h-5" />
              {currentLocation ? 'Update My Location' : 'Share My Location'}
            </>
          )}
        </button>

        {/* Current location indicator */}
        {currentLocation && !success && (
          <p className="text-xs text-center text-stone-400">
            📍 Your current location is being shared
          </p>
        )}
      </div>
    </motion.div>
  );
}
