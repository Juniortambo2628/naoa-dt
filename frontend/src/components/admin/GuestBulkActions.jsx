import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Download, FileImage, FileText, MessageCircle, Mail, Send, RotateCcw, Trash2, X, CheckCircle, XCircle, Tags } from 'lucide-react';
import { confirmAction } from '../../utils/feedback';

const BAR_BUTTON = 'flex items-center gap-2 transition-colors text-xs px-4 py-2 bg-stone-800 rounded border border-stone-700 whitespace-nowrap w-full sm:w-auto';

export default function GuestBulkActions({
  selectedIds,
  showBulkMenu,
  setShowBulkMenu,
  isBulkExporting,
  loading,
  onBulkUpdate,
  onBulkWhatsApp,
  onBulkSendInvite,
  onBulkResendConfirmation,
  onExportBulk,
  onExportWhatsAppKit,
  onBulkDelete,
  onBulkSetGroup,
  onClearSelection,
}) {
  return (
    <AnimatePresence>
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:bottom-8 sm:left-1/2 sm:-translate-x-1/2 bg-stone-900 text-white p-3 sm:px-6 sm:py-4 rounded-2xl shadow-2xl z-[100] flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6 border border-stone-800 sm:w-max sm:max-w-[min(95vw,72rem)] max-h-[70vh] overflow-y-auto sm:max-h-none sm:overflow-visible"
        >
          <div className="flex items-center gap-2 lg:pr-6 lg:border-r border-stone-800 shrink-0">
            <div className="w-6 h-6 rounded-full bg-[#A67B5B] flex items-center justify-center text-[10px] font-bold">
              {selectedIds.length}
            </div>
            <span className="text-sm font-medium whitespace-nowrap">Selected</span>
            <button
              onClick={onClearSelection}
              aria-label="Clear selection"
              className="lg:hidden ml-auto p-1.5 hover:bg-stone-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 py-1">
            <div className="contents">
              <select
                className="bg-stone-800 text-white text-xs rounded border-stone-700 focus:ring-[#A67B5B] outline-none px-3 py-2 w-full sm:w-auto"
                onChange={(e) => {
                  if (e.target.value) {
                    onBulkUpdate({ group: e.target.value });
                    e.target.value = '';
                  }
                }}
              >
                <option value="">Set Group...</option>
                <option value="family">Family</option>
                <option value="friends">Friends</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>

              {/* Invite Via — click-toggle submenu */}
              <div className="relative min-w-0">
                <button
                  onClick={() => setShowBulkMenu(prev => prev === 'invite' ? null : 'invite')}
                  className="flex items-center gap-2 bg-stone-800 text-white text-xs px-4 py-2 rounded border border-stone-700 hover:bg-stone-700 transition-colors whitespace-nowrap w-full sm:w-auto justify-between"
                >
                  Invite Via <ChevronDown className={`w-3 h-3 transition-transform ${showBulkMenu === 'invite' ? 'rotate-180' : ''}`} />
                </button>
                {showBulkMenu === 'invite' && (
                  <div className="mt-2 w-full sm:absolute sm:bottom-full sm:left-0 sm:mb-2 sm:mt-0 sm:w-40 bg-stone-800 border border-stone-700 rounded-lg shadow-xl py-1 z-[110]">
                    <button
                      onClick={() => { onBulkWhatsApp(); setShowBulkMenu(null); }}
                      className="w-full text-left px-3 py-2 hover:bg-stone-700 text-xs flex items-center gap-2 text-white"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-green-500" /> WhatsApp
                    </button>
                    <button
                      onClick={() => { onBulkSendInvite(); setShowBulkMenu(null); }}
                      className="w-full text-left px-3 py-2 hover:bg-stone-700 text-xs flex items-center gap-2 text-white"
                      disabled={isBulkExporting}
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-400" /> Email
                    </button>
                    <button
                      onClick={() => { onBulkResendConfirmation(); setShowBulkMenu(null); }}
                      className="w-full text-left px-3 py-2 hover:bg-stone-700 text-xs flex items-center gap-2 text-white"
                      disabled={loading}
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" /> Resend Confirmation
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="contents">
              {/* Export — click-toggle submenu */}
              <div className="relative min-w-0">
                <button
                  onClick={() => setShowBulkMenu(prev => prev === 'export' ? null : 'export')}
                  className="flex items-center gap-2 hover:text-[#A67B5B] transition-colors text-xs px-4 py-2 bg-stone-800 rounded border border-stone-700 whitespace-nowrap w-full sm:w-auto justify-between"
                >
                  <Download className="w-4 h-4" /> Export <ChevronDown className={`w-3 h-3 transition-transform ${showBulkMenu === 'export' ? 'rotate-180' : ''}`} />
                </button>
                {showBulkMenu === 'export' && (
                  <div className="mt-2 w-full sm:absolute sm:bottom-full sm:left-0 sm:mb-2 sm:mt-0 sm:w-40 bg-stone-800 border border-stone-700 rounded-lg shadow-xl py-1 z-[110]">
                    <button
                      onClick={() => { onExportBulk('png'); setShowBulkMenu(null); }}
                      className="w-full text-left px-3 py-2 hover:bg-stone-700 text-xs flex items-center gap-2 text-white"
                      disabled={isBulkExporting}
                    >
                      <FileImage className="w-3.5 h-3.5 text-emerald-400" /> Export PNG
                    </button>
                    <button
                      onClick={() => { onExportBulk('pdf'); setShowBulkMenu(null); }}
                      className="w-full text-left px-3 py-2 hover:bg-stone-700 text-xs flex items-center gap-2 text-white"
                      disabled={isBulkExporting}
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" /> Export PDF
                    </button>
                    <button
                      onClick={() => { onExportWhatsAppKit(); setShowBulkMenu(null); }}
                      className="w-full text-left px-3 py-2 hover:bg-stone-700 text-xs flex items-center gap-2 text-white"
                      disabled={isBulkExporting}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-green-500" /> WhatsApp Kit
                    </button>
                  </div>
                )}
              </div>

              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => setShowBulkMenu(prev => prev === 'via' ? null : 'via')}
                  className={`${BAR_BUTTON} justify-between hover:text-[#A67B5B]`}
                  aria-expanded={showBulkMenu === 'via'}
                >
                  <MessageCircle className="w-4 h-4" /> Invite via <ChevronDown className={`w-3 h-3 transition-transform ${showBulkMenu === 'via' ? 'rotate-180' : ''}`} />
                </button>
                {showBulkMenu === 'via' && (
                  <div className="mt-2 w-full sm:absolute sm:bottom-full sm:left-0 sm:mb-2 sm:mt-0 sm:w-36 bg-stone-800 border border-stone-700 rounded-lg shadow-xl py-1 z-[110]">
                    {[['whatsapp', 'WhatsApp'], ['email', 'Email']].map(([id, label]) => (
                      <button
                        key={id}
                        onClick={() => { onBulkUpdate({ invitation_via: id }); setShowBulkMenu(null); }}
                        className="w-full text-left px-3 py-2 hover:bg-stone-700 text-xs text-white"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {[
                { label: 'Set Group', icon: Tags, hover: 'hover:text-[#A67B5B]', onClick: onBulkSetGroup },
                { label: 'Mark Confirmed', icon: CheckCircle, hover: 'hover:text-green-400', confirm: 'Mark {n} selected guests as confirmed?', update: { rsvp_status: 'confirmed' } },
                { label: 'Mark Declined', icon: XCircle, hover: 'hover:text-red-400', confirm: 'Mark {n} selected guests as declined?', update: { rsvp_status: 'declined' } },
                { label: 'Reset RSVP', icon: RotateCcw, hover: 'hover:text-orange-400', confirm: 'Reset RSVP status for {n} selected guests?', update: { rsvp_status: 'pending', rsvp_message: null, dietary_notes: null } },
                { label: 'Delete', icon: Trash2, hover: 'hover:text-red-400', onClick: onBulkDelete },
              ].map(({ label, icon, hover, confirm, update, onClick }) => {
                const Icon = icon;
                return (
                <button
                  key={label}
                  onClick={async () => {
                    if (onClick) return onClick();
                    if (await confirmAction(confirm.replace('{n}', selectedIds.length))) onBulkUpdate(update);
                  }}
                  className={`${BAR_BUTTON} justify-center ${hover}`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={onClearSelection}
            aria-label="Clear selection"
            className="hidden lg:block ml-2 p-1 hover:bg-stone-800 rounded-lg transition-colors border-l border-stone-800 pl-4 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
