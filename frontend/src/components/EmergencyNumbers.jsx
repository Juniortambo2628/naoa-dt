import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, Shield, Heart, Flame, Map, HeartHandshake, 
  Baby, Scale, Building, Smartphone, ChevronDown, 
  ExternalLink, Loader2 
} from 'lucide-react';
import { api } from '../services/api';

const iconMap = {
  phone: Phone,
  smartphone: Smartphone,
  shield: Shield,
  heart: Heart,
  flame: Flame,
  map: Map,
  'heart-handshake': HeartHandshake,
  baby: Baby,
  scale: Scale,
  building: Building,
  hospital: Building,
};

const categoryColors = {
  general: 'bg-[#A67B5B]',
  police: 'bg-blue-600',
  medical: 'bg-red-600',
  fire: 'bg-orange-500',
  tourism: 'bg-green-600',
  support: 'bg-purple-600',
};

const categoryLabels = {
  general: 'General',
  police: 'Police',
  medical: 'Medical',
  fire: 'Fire',
  tourism: 'Tourism',
  support: 'Support',
};

export default function EmergencyNumbers({ compact = false }) {
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchNumbers();
  }, []);

  const fetchNumbers = async () => {
    try {
      const response = await api.get('/emergency-numbers');
      setNumbers(response.data);
    } catch (error) {
      console.error('Failed to load emergency numbers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (number) => {
    window.location.href = `tel:${number.replace(/\s/g, '')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#A67B5B]" />
      </div>
    );
  }

  if (numbers.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-stone-200/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <Phone className="w-4 h-4 text-red-600" />
          </div>
          <h3 className="font-serif text-lg text-stone-800">Emergency Numbers</h3>
        </div>
        
        <div className="space-y-2">
          {numbers.slice(0, 3).map((item) => {
            const IconComponent = iconMap[item.icon] || Phone;
            return (
              <button
                key={item.id}
                onClick={() => handleCall(item.number)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors text-left"
              >
                <div className={`w-10 h-10 rounded-full ${categoryColors[item.category]} flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                  <p className="text-xs text-stone-500">{item.number}</p>
                </div>
                <Phone className="w-4 h-4 text-[#A67B5B] flex-shrink-0" />
              </button>
            );
          })}
        </div>

        {numbers.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-3 flex items-center justify-center gap-1 text-sm text-[#A67B5B] hover:text-[#8B6B4B]"
          >
            View all {numbers.length} numbers
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 mt-3 pt-3 border-t border-stone-200">
                {numbers.slice(3).map((item) => {
                  const IconComponent = iconMap[item.icon] || Phone;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleCall(item.number)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors text-left"
                    >
                      <div className={`w-10 h-10 rounded-full ${categoryColors[item.category]} flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                        <p className="text-xs text-stone-500">{item.number}</p>
                      </div>
                      <Phone className="w-4 h-4 text-[#A67B5B] flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <Phone className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="font-serif text-2xl text-stone-800">Emergency Numbers</h2>
          <p className="text-sm text-stone-500">Important contacts for your safety</p>
        </div>
      </div>

      {/* Quick Access - General Emergency */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white">
        <p className="text-sm font-medium opacity-90 mb-2">General Emergency</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">999</p>
            <p className="text-sm opacity-80">Police • Ambulance • Fire</p>
          </div>
          <button
            onClick={() => handleCall('999')}
            className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <Phone className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* All Numbers by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(categoryColors).map((category) => {
          const categoryNumbers = numbers.filter(n => n.category === category);
          if (categoryNumbers.length === 0) return null;
          
          return (
            <div key={category} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className={`${categoryColors[category]} px-4 py-3`}>
                <h3 className="text-white font-medium">{categoryLabels[category]}</h3>
              </div>
              <div className="divide-y divide-stone-100">
                {categoryNumbers.map((item) => {
                  const IconComponent = iconMap[item.icon] || Phone;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleCall(item.number)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors text-left"
                    >
                      <IconComponent className="w-5 h-5 text-stone-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-stone-500 truncate">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-mono text-stone-600">{item.number}</span>
                        <Phone className="w-4 h-4 text-[#A67B5B]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
