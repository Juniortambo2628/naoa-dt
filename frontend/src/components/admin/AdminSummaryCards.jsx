import { motion } from 'framer-motion';

const gridColumns = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-3 xl:grid-cols-5',
  6: 'lg:grid-cols-3 xl:grid-cols-6',
};

/**
 * AdminSummaryCards — compact overview stat cards for admin pages.
 *
 * @param {Array} cards - Array of {
 *     label, value, icon: LucideIcon, color,
 *     hint?: string       — secondary line (e.g. "64% of invited"),
 *     onClick?: function  — makes the card a button (e.g. apply a filter),
 *     active?: boolean    — highlights the card (e.g. its filter is applied),
 *   }
 * @param {number} [columns=4] - Number of columns on large screens (1-6)
 */
export default function AdminSummaryCards({ cards = [], columns = 4 }) {
  if (!cards.length) return null;

  const gridCols = gridColumns[columns] || gridColumns[4];
  // Six/five-up cards are too narrow for an icon between xl and 2xl.
  const iconVisibility = columns >= 5 ? 'flex xl:hidden 2xl:flex' : 'flex';

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 ${gridCols} gap-3 lg:gap-4`}>
      {cards.map((stat, index) => {
        const Icon = stat.icon;
        const Tag = stat.onClick ? motion.button : motion.div;
        return (
          <Tag
            key={stat.label}
            type={stat.onClick ? 'button' : undefined}
            onClick={stat.onClick}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            aria-pressed={stat.onClick ? !!stat.active : undefined}
            className={`px-3.5 py-3 rounded-2xl bg-white flex items-center gap-3 text-left min-w-0 transition-shadow ${
              stat.onClick ? 'cursor-pointer hover:ring-2 hover:ring-[#A67B5B]/20' : ''
            } ${stat.active ? 'ring-2 ring-[#A67B5B]/50' : ''}`}
            style={{ boxShadow: '0 4px 20px rgba(166, 123, 91, 0.08)' }}
          >
            <div
              className={`w-9 h-9 rounded-xl items-center justify-center shrink-0 ${iconVisibility}`}
              style={{ background: `${stat.color}15` }}
            >
              {Icon && <Icon className="w-5 h-5" style={{ color: stat.color }} />}
            </div>
            <div className="min-w-0">
              <p className="text-xl font-semibold leading-tight text-[#4A3F35]">
                {stat.value}
              </p>
              <p className="text-sm text-[#8B7B6B] truncate">
                {stat.label}
              </p>
              {stat.hint && (
                <p className="text-xs text-stone-400 truncate" title={stat.hint}>
                  {stat.hint}
                </p>
              )}
            </div>
          </Tag>
        );
      })}
    </div>
  );
}
