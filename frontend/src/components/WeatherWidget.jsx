import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Wind, Thermometer, Droplets } from 'lucide-react';
import { weatherService } from '../services/api';

const WMO_CODES = {
    0: { icon: Sun, label: 'Clear sky', dress: 'Light and breathable attire' },
    1: { icon: Sun, label: 'Mainly clear', dress: 'Comfortable, light layers' },
    2: { icon: Cloud, label: 'Partly cloudy', dress: 'Light jacket recommended' },
    3: { icon: Cloud, label: 'Overcast', dress: 'Light layers, no umbrella needed' },
    45: { icon: Cloud, label: 'Foggy', dress: 'Layer up, visibility may be low' },
    48: { icon: Cloud, label: 'Rime fog', dress: 'Warm layers recommended' },
    51: { icon: CloudDrizzle, label: 'Light drizzle', dress: 'Bring a light rain jacket' },
    53: { icon: CloudDrizzle, label: 'Moderate drizzle', dress: 'Umbrella recommended' },
    55: { icon: CloudDrizzle, label: 'Dense drizzle', dress: 'Waterproof layer needed' },
    61: { icon: CloudRain, label: 'Slight rain', dress: 'Bring an umbrella' },
    63: { icon: CloudRain, label: 'Moderate rain', dress: 'Waterproof jacket & umbrella' },
    65: { icon: CloudRain, label: 'Heavy rain', dress: 'Full rain gear recommended' },
    71: { icon: CloudSnow, label: 'Slight snow', dress: 'Warm coat & layers' },
    73: { icon: CloudSnow, label: 'Moderate snow', dress: 'Winter coat essential' },
    75: { icon: CloudSnow, label: 'Heavy snow', dress: 'Bundle up warmly' },
    80: { icon: CloudRain, label: 'Rain showers', dress: 'Keep umbrella handy' },
    81: { icon: CloudRain, label: 'Moderate showers', dress: 'Waterproof everything' },
    82: { icon: CloudRain, label: 'Violent showers', dress: 'Stay covered, waterproof gear' },
    95: { icon: CloudLightning, label: 'Thunderstorm', dress: 'Seek shelter if needed' },
    96: { icon: CloudLightning, label: 'Thunderstorm with hail', dress: 'Stay indoors if possible' },
    99: { icon: CloudLightning, label: 'Thunderstorm with heavy hail', dress: 'Indoor venue backup advised' },
};

export default function WeatherWidget({ weddingDate }) {
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const res = await weatherService.getForecast();
                setForecast(res.data);
            } catch {
                setError('Weather unavailable');
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 animate-pulse">
                <div className="h-4 bg-stone-100 rounded w-1/3 mb-3" />
                <div className="h-8 bg-stone-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-stone-100 rounded w-2/3" />
            </div>
        );
    }

    if (error || !forecast?.daily) return null;

    const daily = forecast.daily;
    const weddingDay = weddingDate ? new Date(weddingDate).toISOString().split('T')[0] : null;
    let dayIndex = 0;

    if (weddingDay) {
        dayIndex = daily.time.findIndex(d => d === weddingDay);
        if (dayIndex === -1) dayIndex = 0;
    }

    const maxTemp = Math.round(daily.temperature_2m_max[dayIndex]);
    const minTemp = Math.round(daily.temperature_2m_min[dayIndex]);
    const precipProb = daily.precipitation_probability_max?.[dayIndex] ?? 0;
    const weatherCode = daily.weathercode?.[dayIndex] ?? 0;
    const weatherInfo = WMO_CODES[weatherCode] || WMO_CODES[0];
    const WeatherIcon = weatherInfo.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5"
        >
            <div className="flex items-center gap-2 mb-4">
                <Cloud className="w-4 h-4 text-[#A67B5B]" />
                <h4 className="font-semibold text-stone-800 text-sm">Weather Forecast</h4>
            </div>

            <div className="flex items-center gap-4 mb-3">
                <WeatherIcon className="w-10 h-10 text-[#A67B5B]" />
                <div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-stone-800">{maxTemp}°</span>
                        <span className="text-sm text-stone-400">/ {minTemp}°C</span>
                    </div>
                    <p className="text-xs text-stone-500">{weatherInfo.label}</p>
                </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-stone-500 mb-3">
                <span className="flex items-center gap-1">
                    <Droplets className="w-3 h-3" />
                    {precipProb}% rain
                </span>
                <span className="flex items-center gap-1">
                    <Wind className="w-3 h-3" />
                    {daily.temperature_2m_max[dayIndex] > 25 ? 'Breezy' : 'Calm'}
                </span>
            </div>

            <div 
                className="p-3 rounded-xl text-xs"
                style={{ background: 'rgba(139, 154, 125, 0.1)', color: '#6B5D52' }}
            >
                <span className="font-medium">Dress suggestion:</span> {weatherInfo.dress}
            </div>

            {/* 3-day mini forecast */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-stone-50">
                {[0, 1, 2].map(offset => {
                    const idx = Math.min(dayIndex + offset, daily.time.length - 1);
                    const code = daily.weathercode?.[idx] ?? 0;
                    const DayIcon = (WMO_CODES[code] || WMO_CODES[0]).icon;
                    const date = new Date(daily.time[idx]);
                    const dayName = offset === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
                    return (
                        <div key={offset} className="flex-1 text-center">
                            <p className="text-[10px] text-stone-400 mb-1">{dayName}</p>
                            <DayIcon className="w-4 h-4 mx-auto text-stone-400 mb-0.5" />
                            <p className="text-[10px] font-medium text-stone-600">
                                {Math.round(daily.temperature_2m_max[idx])}°
                            </p>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
