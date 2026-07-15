import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * AdminFloatingToolbar — fixed bottom-center toolbar for page-level actions.
 *
 * @param {Array} actions - Array of action objects:
 *   {
 *     id: string,
 *     label: string,
 *     icon: LucideIcon,
 *     onClick: () => void,
 *     variant?: 'primary' | 'secondary' | 'danger',
 *     disabled?: boolean,
 *     hidden?: boolean,
 *   }
 */
export default function AdminFloatingToolbar({ actions = [] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);

  const visibleActions = actions.filter((a) => !a.hidden);
  if (visibleActions.length === 0) return null;

  // Show first 4 actions directly; collapse the rest into a "More" menu
  const primaryActions = visibleActions.slice(0, 4);
  const overflowActions = visibleActions.slice(4);
  const hasOverflow = overflowActions.length > 0;

  const baseButton =
    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all';

  const variantStyles = {
    primary:
      'bg-[#A67B5B] text-white hover:bg-[#8B5E3C] shadow-md',
    secondary:
      'bg-white/80 text-[#4A3F35] hover:bg-white border border-stone-200/60',
    danger:
      'bg-white/80 text-red-600 hover:bg-red-50 border border-stone-200/60',
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="toolbar"
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div
            className="flex items-center gap-2 px-2 py-2 rounded-2xl border border-white/40 shadow-2xl backdrop-blur-md"
            style={{
              background: 'rgba(255, 249, 245, 0.92)',
              boxShadow: '0 12px 40px rgba(74, 63, 53, 0.18)',
            }}
          >
            {primaryActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`${baseButton} ${variantStyles[action.variant || 'secondary']} ${
                    action.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={action.label}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span className="hidden sm:inline">{action.label}</span>
                </button>
              );
            })}

            {hasOverflow && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className={`${baseButton} ${variantStyles.secondary}`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">More</span>
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[10rem] bg-white rounded-xl shadow-xl border border-stone-100 py-2 overflow-hidden"
                    >
                      {overflowActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.id}
                            onClick={() => {
                              action.onClick();
                              setMenuOpen(false);
                            }}
                            disabled={action.disabled}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-stone-50 transition-colors ${
                              action.variant === 'danger' ? 'text-red-600' : 'text-stone-700'
                            } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {Icon && <Icon className="w-4 h-4" />}
                            {action.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Visibility toggler */}
            <button
              onClick={() => setVisible(false)}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-white/60 transition-colors"
              title="Hide toolbar"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.button
          key="toolbar-toggle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setVisible(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-2.5 rounded-full bg-white/90 border border-stone-200 shadow-lg text-[#A67B5B] hover:bg-white transition-colors"
          title="Show toolbar"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
