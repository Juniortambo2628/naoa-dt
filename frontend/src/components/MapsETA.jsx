import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { MapPin, Navigation, Car, Footprints, ExternalLink } from 'lucide-react';

function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateTime(distanceKm, mode = 'driving') {
    const speeds = { driving: 40, walking: 5 };
    const hours = distanceKm / (speeds[mode] || 40);
    const mins = Math.round(hours * 60);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
}

function createIcon(color) {
    return divIcon({
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
        html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
        </div>`,
    });
}

const userIcon = createIcon('#3B82F6');
const venueIcon = createIcon('#A67B5B');

function FitBounds({ center, userPos }) {
    const map = useMap();
    
    useEffect(() => {
        if (userPos && center) {
            const bounds = [userPos, center];
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        } else if (center) {
            map.setView(center, 14);
        }
    }, [center, userPos, map]);
    
    return null;
}

export default function MapsETA({ venueName, venueAddress, venueLat, venueLng }) {
    const [userLocation, setUserLocation] = useState(null);
    const [distance, setDistance] = useState(null);
    const [locationError, setLocationError] = useState(null);

    const venuePos = useMemo(() => {
        const lat = parseFloat(venueLat) || -1.2921;
        const lng = parseFloat(venueLng) || 36.8219;
        return [lat, lng];
    }, [venueLat, venueLng]);

    useEffect(() => {
        if (!navigator.geolocation || !venueLat || !venueLng) return;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setUserLocation([latitude, longitude]);
                const dist = haversineDistance(latitude, longitude, venuePos[0], venuePos[1]);
                setDistance(dist);
            },
            () => {
                setLocationError('Location access denied');
            },
            { enableHighAccuracy: false, timeout: 10000 }
        );
    }, [venueLat, venueLng, venuePos]);

    const mapsUrl = venueLat && venueLng
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venueName || venueAddress || '')}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueAddress || venueName || '')}`;

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            {/* Embedded Map */}
            <div className="h-48 md:h-56 w-full relative">
                <MapContainer
                    center={venuePos}
                    zoom={userLocation ? 12 : 14}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    attributionControl={false}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={venuePos} icon={venueIcon}>
                        <Popup>
                            <strong>{venueName || 'Wedding Venue'}</strong><br />
                            {venueAddress}
                        </Popup>
                    </Marker>
                    {userLocation && (
                        <Marker position={userLocation} icon={userIcon}>
                            <Popup>Your Location</Popup>
                        </Marker>
                    )}
                    <FitBounds center={venuePos} userPos={userLocation} />
                </MapContainer>

                {/* Map overlay gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>

            {/* Info Section */}
            <div className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#A67B5B]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 text-[#A67B5B]" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-stone-700">{venueName || 'Wedding Venue'}</p>
                        <p className="text-xs text-stone-400">{venueAddress || 'Kenya'}</p>
                    </div>
                </div>

                {distance !== null && (
                    <div className="bg-[#FAF7F2] rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-2">
                            <Navigation className="w-3.5 h-3.5 text-[#A67B5B]" />
                            <span className="font-medium">{distance.toFixed(1)} km away</span>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1 text-[11px] text-stone-500">
                                <Car className="w-3 h-3" />
                                <span>{estimateTime(distance, 'driving')} drive</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-stone-500">
                                <Footprints className="w-3 h-3" />
                                <span>{estimateTime(distance, 'walking')} walk</span>
                            </div>
                        </div>
                    </div>
                )}

                {locationError && (
                    <p className="text-[11px] text-stone-400 italic">Enable location for distance estimate</p>
                )}

                <button
                    onClick={() => window.open(mapsUrl, '_blank', 'noopener,noreferrer')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[#A67B5B] border border-[#A67B5B]/20 hover:bg-[#A67B5B]/5 transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                    Get Directions
                </button>
            </div>
        </div>
    );
}
