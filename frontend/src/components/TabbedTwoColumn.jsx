import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft } from 'lucide-react';

/**
 * Reusable two-column tabbed layout, matching the FAQ page's design language:
 * a left navigation column of tabs and a right content pane. On mobile it
 * collapses to a single card that toggles between the tab list and the active
 * tab's content (with a back arrow), so the same markup serves both breakpoints.
 *
 * Props:
 * - items: [{ id, label, icon? }]  — the tabs
 * - activeId / onChange            — controlled active tab
 * - renderContent(activeItem)      — the right-pane content for the active tab
 * - title                          — left column header (default "Menu")
 * - navWidthClass                  — desktop nav column width (default w-64)
 * - heightClass                    — layout height (default h-[70vh])
 */
export default function TabbedTwoColumn({
  items = [],
  activeId,
  onChange,
  renderContent,
  title = 'Menu',
  navWidthClass = 'w-64',
  heightClass = 'h-[70vh]',
  className = '',
}) {
  // On mobile we show either the tab list or the selected tab's content.
  const [mobileView, setMobileView] = useState('list');
  const activeItem = items.find((it) => it.id === activeId) || null;

  // Deep-linking in (active tab set from outside) jumps mobile to the content.
  useEffect(() => {
    if (activeId != null) setMobileView('content');
  }, [activeId]);

  const renderNav = (onPick) => (
    <div className="flex-1 overflow-y-auto p-3 space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onPick(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-between group ${
              isActive
                ? 'bg-white shadow-sm border border-stone-100'
                : 'border border-transparent hover:bg-white/50 hover:border-stone-100'
            }`}
          >
            <span className="flex items-center gap-3 min-w-0">
              {Icon && (
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#A67B5B]' : 'text-stone-400 group-hover:text-stone-500'
                  }`}
                />
              )}
              <span
                className={`font-serif text-base truncate ${
                  isActive ? 'text-[#A67B5B]' : 'text-stone-600 group-hover:text-stone-800'
                }`}
              >
                {item.label}
              </span>
            </span>
            <ChevronRight
              className={`w-4 h-4 flex-shrink-0 transition-transform ${
                isActive ? 'text-[#A67B5B] translate-x-1' : 'text-stone-300 group-hover:text-stone-400'
              }`}
            />
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden ${className}`}>
      {/* Mobile: single card with a list <-> content toggle */}
      <div className={`flex md:hidden flex-col min-h-0 ${heightClass}`}>
        <AnimatePresence mode="wait">
          {mobileView === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="px-6 py-4 border-b border-stone-100 shrink-0">
                <h2 className="font-serif text-lg text-stone-800">{title}</h2>
              </div>
              {renderNav((id) => onChange?.(id))}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  aria-label="Back to menu"
                  className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition-colors text-[#A67B5B]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="font-serif text-sm text-stone-500 truncate">{activeItem?.label}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-5">{renderContent?.(activeItem)}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: two-column layout */}
      <div className={`hidden md:flex flex-row min-h-0 ${heightClass}`}>
        <div className={`${navWidthClass} shrink-0 bg-[#FFF9F5]/40 border-r border-stone-100 flex flex-col min-h-0`}>
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="font-serif text-lg text-stone-800">{title}</h2>
          </div>
          {renderNav((id) => onChange?.(id))}
        </div>
        <div className="flex-1 min-w-0 overflow-y-auto bg-white">
          <div className="p-6 lg:p-8">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {renderContent?.(activeItem)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
