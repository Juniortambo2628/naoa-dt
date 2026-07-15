import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

/**
 * AdminSummaryCards — consistent overview stat cards for admin pages.
 *
 * @param {Array} cards - Array of { label, value, icon: LucideIcon, color }
 * @param {number} [columns=4] - Number of columns on large screens (1-4)
 */
export default function AdminSummaryCards({ cards = [], columns = 4 }) {
  if (!cards.length) return null;

  const gridCols = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  }[columns] || 'lg:grid-cols-4';

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-6`}>
      {cards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.25 }}
            className="p-6 rounded-2xl bg-white"
            style={{ boxShadow: '0 4px 20px rgba(166, 123, 91, 0.08)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}15` }}
              >
                {Icon && <Icon className="w-6 h-6" style={{ color: stat.color }} />}
              </div>
              <TrendingUp className="w-5 h-5" style={{ color: '#8B9A7D' }} />
            </div>
            <p className="text-3xl font-semibold mb-1 text-[#4A3F35]">
              {stat.value}
            </p>
            <p className="text-sm text-[#8B7B6B]">
              {stat.label}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
