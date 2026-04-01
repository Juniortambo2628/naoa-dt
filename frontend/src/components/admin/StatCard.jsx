import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function StatCard({ icon, label, value, color }) {
    return (
        <div 
            className="p-6 rounded-2xl transition-all hover:scale-[1.02]"
            style={{ 
              background: 'white',
              boxShadow: '0 4px 20px rgba(166, 123, 91, 0.08)',
            }}
        >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${color}15` }}
              >
                {React.cloneElement(icon, { style: { color } })}
              </div>
              <TrendingUp className="w-5 h-5 text-[#8B9A7D]" />
            </div>
            <p className="text-3xl font-semibold mb-1 text-[#4A3F35]">
              {value}
            </p>
            <p className="text-sm text-[#8B7B6B]">
              {label}
            </p>
        </div>
    );
}
