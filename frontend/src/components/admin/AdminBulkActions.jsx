import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MoreHorizontal, Trash2, Mail, CheckCircle, Download, Users } from 'lucide-react';
import Button from '../Button';

/**
 * AdminBulkActions — reusable bulk-selection action bar for admin list pages.
 *
 * @param {number} selectedCount
 * @param {function} onClearSelection
 * @param {Array} actions - Array of action objects:
 *   {
 *     id: string,
 *     label: string,
 *     icon: LucideIcon,
 *     onClick: () => void,
 *     variant?: 'primary' | 'secondary' | 'danger',
 *     disabled?: boolean,
 *   }
 */
export default function AdminBulkActions({ selectedCount = 0, onClearSelection, actions = [] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  if (selectedCount === 0 || actions.length === 0) return null;

  const primaryActions = actions.slice(0, 3);
  const overflowActions = actions.slice(3);
  const hasOverflow = overflowActions.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-6 p-3 rounded-xl bg-[#A67B5B]/5 border border-[#A67B5B]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#A67B5B]/10 flex items-center justify-center">
          <Users className="w-4 h-4 text-[#A67B5B]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#4A3F35]">
            {selectedCount} selected
          </p>
          <p className="text-xs text-[#8B7B6B]">
            Use the actions below or click items to deselect.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {primaryActions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant || 'primary'}
            icon={action.icon}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        ))}

        {hasOverflow && (
          <div className="relative" ref={menuRef}>
            <Button
              size="icon"
              icon={MoreHorizontal}
              aria-label="More actions"
              onClick={() => setMenuOpen((v) => !v)}
            />

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute right-0 bottom-full mb-2 min-w-[10rem] bg-white rounded-xl shadow-xl border border-stone-100 py-2 overflow-hidden z-20"
                >
                  {overflowActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => { action.onClick(); setMenuOpen(false); }}
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

        <button aria-label="Clear selection"
          onClick={onClearSelection}
          className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-white transition-colors"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Preset bulk action sets for common use cases
// eslint-disable-next-line react-refresh/only-export-components
export const bulkActionPresets = {
  guests: ({ onDelete, onExport, onEmail, onWhatsApp, onConfirm }) => [
    { id: 'confirm', label: 'Confirm RSVP', icon: CheckCircle, variant: 'secondary', onClick: onConfirm },
    { id: 'email', label: 'Send Email', icon: Mail, variant: 'primary', onClick: onEmail },
    { id: 'export', label: 'Export', icon: Download, variant: 'primary', onClick: onExport },
    { id: 'whatsapp', label: 'WhatsApp', icon: Mail, variant: 'primary', onClick: onWhatsApp },
    { id: 'delete', label: 'Delete', icon: Trash2, variant: 'danger', onClick: onDelete },
  ],
  gifts: ({ onDelete, onToggleAvailability }) => [
    { id: 'toggle', label: 'Toggle Available', icon: CheckCircle, variant: 'secondary', onClick: onToggleAvailability },
    { id: 'delete', label: 'Delete', icon: Trash2, variant: 'danger', onClick: onDelete },
  ],
  default: ({ onDelete }) => [
    { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger', onClick: onDelete },
  ],
};
