import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Download, FileImage, FileText, MessageCircle, Mail, Send, RotateCcw, Trash2, X } from 'lucide-react';

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
  onBulkDelete,
  onClearSelection,
}) {
  return (
    <AnimatePresence>
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-[100] flex items-center flex-nowrap overflow-visible no-scrollbar gap-6 border border-stone-800 max-w-[95vw]"
        >
          <div className="flex items-center gap-2 pr-6 border-r border-stone-800 shrink-0">
            <div className="w-6 h-6 rounded-full bg-[#A67B5B] flex items-center justify-center text-[10px] font-bold">
              {selectedIds.length}
            </div>
            <span className="text-sm font-medium whitespace-nowrap">Selected</span>
          </div>

          <div className="flex items-center gap-3 overflow-visible no-scrollbar py-1">
            <div className="flex items-center gap-3 border-r border-stone-800 pr-4 shrink-0">
              <select
                className="bg-stone-800 text-white text-xs rounded border-stone-700 focus:ring-[#A67B5B] outline-none px-3 py-2 w-36"
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
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowBulkMenu(prev => prev === 'invite' ? null : 'invite')}
                  className="flex items-center gap-2 bg-stone-800 text-white text-xs px-4 py-2 rounded border border-stone-700 hover:bg-stone-700 transition-colors w-36 justify-between"
                >
                  Invite Via <ChevronDown className={`w-3 h-3 transition-transform ${showBulkMenu === 'invite' ? 'rotate-180' : ''}`} />
                </button>
                {showBulkMenu === 'invite' && (
                  <div className="absolute bottom-full left-0 mb-2 w-40 bg-stone-800 border border-stone-700 rounded-lg shadow-xl py-1 z-[110]">
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

            <div className="flex items-center gap-3 shrink-0">
              {/* Export — click-toggle submenu */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowBulkMenu(prev => prev === 'export' ? null : 'export')}
                  className="flex items-center gap-2 hover:text-[#A67B5B] transition-colors text-xs px-4 py-2 bg-stone-800 rounded border border-stone-700 w-36 justify-between"
                >
                  <Download className="w-4 h-4" /> Export <ChevronDown className={`w-3 h-3 transition-transform ${showBulkMenu === 'export' ? 'rotate-180' : ''}`} />
                </button>
                {showBulkMenu === 'export' && (
                  <div className="absolute bottom-full left-0 mb-2 w-40 bg-stone-800 border border-stone-700 rounded-lg shadow-xl py-1 z-[110]">
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
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (window.confirm(`Reset RSVP status for ${selectedIds.length} selected guests?`)) {
                    onBulkUpdate({ rsvp_status: 'pending', rsvp_message: null, dietary_notes: null });
                  }
                }}
                className="flex items-center gap-2 hover:text-orange-400 transition-colors text-xs px-4 py-2 bg-stone-800 rounded border border-stone-700 w-36 justify-center"
              >
                <RotateCcw className="w-4 h-4" /> Reset RSVP
              </button>

              <button
                onClick={onBulkDelete}
                className="flex items-center gap-2 hover:text-red-400 transition-colors text-xs px-4 py-2 bg-stone-800 rounded border border-stone-700 w-36 justify-center"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>

          <button
            onClick={onClearSelection}
            className="ml-2 p-1 hover:bg-stone-800 rounded-lg transition-colors border-l border-stone-800 pl-4 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
