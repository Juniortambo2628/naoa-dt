import { Users, Check, Send, Edit, Trash2, RotateCcw, MessageCircle, Mail } from 'lucide-react';
import AdminCard from './AdminCard';
import EmptyState from './EmptyState';
import Spinner from './Spinner';

export default function GuestList({
  guestsLoading,
  filteredGuests,
  pagedGuests,
  viewMode,
  selectedIds,
  searchQuery,
  totalPages,
  currentPage,
  itemsPerPage,
  onToggleSelect,
  onToggleSelectAll,
  onInlineSave,
  onInlineCreate,
  onInviteRequest,
  onEdit,
  onDelete,
  onUpdateGuest,
  onSetCurrentPage,
}) {
  return (
    <AdminCard padding={false} className="overflow-hidden">
      {guestsLoading ? (
        <EmptyState loading />
      ) : filteredGuests.length === 0 ? (
        <EmptyState icon={Users} message="No guests found" searchQuery={searchQuery} />
      ) : viewMode === 'spreadsheet' ? (
        <div className="overflow-x-auto relative" style={{ maxHeight: '70vh' }}>
          <table className="w-full text-sm border-collapse border-stone-200">
            <thead className="sticky top-0 bg-stone-50 z-10 shadow-sm border-b border-stone-200">
              <tr>
                <th className="px-2 py-3 w-10 text-center border-r border-stone-200 bg-stone-100"></th>
                <th className="px-2 py-3 text-center font-mono text-stone-500 w-12 border-r border-stone-200 bg-stone-100">#</th>
                <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">A - Name</th>
                <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">B - Email</th>
                <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">C - Phone</th>
                <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">D - Group</th>
                <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">E - Invitation Via</th>
                <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">F - Extra Plus Ones Allowed</th>
                <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">G - RSVP Code</th>
                <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100 text-center">H - Invite</th>
                <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">I - RSVP Status</th>
                <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100">J - Message</th>
                <th className="px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider bg-stone-100">K - Dietary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {pagedGuests.map((guest, index) => (
                <tr key={guest.id} className={`hover:bg-blue-50/30 group ${selectedIds.includes(guest.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-2 py-2 text-center border-r border-stone-200">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded border-stone-300 text-[#A67B5B] focus:ring-[#A67B5B]"
                      checked={selectedIds.includes(guest.id)}
                      onChange={() => onToggleSelect(guest.id)}
                    />
                  </td>
                  <td className="px-2 py-2 text-center text-stone-400 bg-stone-50 border-r border-stone-200 select-none">
                    {index + 1}
                  </td>
                  <td className="p-0 border-r border-stone-200 relative">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        defaultValue={guest.name}
                        onBlur={(e) => onInlineSave(guest, 'name', e.target.value)}
                        className={`w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all font-medium text-stone-800 ${guest.parent_guest_id ? 'pl-8' : ''}`}
                        placeholder="Name"
                      />
                      {guest.parent_guest_id && (
                        <div className="absolute left-2 text-purple-400 pointer-events-none" title="Plus One">
                          <Users className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-0 border-r border-stone-200 relative">
                    <input
                      type="email"
                      defaultValue={guest.email || ''}
                      onBlur={(e) => onInlineSave(guest, 'email', e.target.value)}
                      className="w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all text-stone-600"
                      placeholder="Email"
                    />
                  </td>
                  <td className="p-0 border-r border-stone-200 relative">
                    <input
                      type="text"
                      defaultValue={guest.phone || ''}
                      onBlur={(e) => onInlineSave(guest, 'phone', e.target.value)}
                      className="w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all text-stone-600"
                      placeholder="Phone"
                    />
                  </td>
                  <td className="p-0 border-r border-stone-200 relative">
                    <input
                      type="text"
                      defaultValue={guest.group || ''}
                      onBlur={(e) => onInlineSave(guest, 'group', e.target.value)}
                      className="w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all text-stone-600 capitalize"
                      placeholder="Group"
                    />
                  </td>
                  <td className="p-0 border-r border-stone-200 relative">
                    <select
                      value={guest.invitation_via || 'whatsapp'}
                      onChange={(e) => onInlineSave(guest, 'invitation_via', e.target.value)}
                      className="w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all text-stone-600 appearance-none"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                    </select>
                  </td>
                  <td className="p-0 border-r border-stone-200 relative">
                    <input
                      type="number"
                      defaultValue={guest.plus_ones_allowed || 0}
                      min="0"
                      onBlur={(e) => onInlineSave(guest, 'plus_ones_allowed', e.target.value)}
                      className="w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all font-mono text-stone-600"
                    />
                  </td>
                  <td className="px-3 py-2 text-stone-600 border-r border-stone-200 font-mono text-xs">
                    {guest.unique_code || '—'}
                  </td>
                  <td className="px-3 py-2 border-r border-stone-200 text-center">
                    <button
                      onClick={() => onInviteRequest(guest)}
                      className={`p-1 rounded-md transition-all ${guest.invitation?.status === 'sent' || guest.invitation?.status === 'responded' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-400 hover:bg-[#A67B5B]/10 hover:text-[#A67B5B]'}`}
                      title="Invite guest"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span className={`px-2 py-1 rounded-full flex items-center justify-center gap-1 w-fit whitespace-nowrap
                      ${guest.rsvp_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        guest.rsvp_status === 'declined' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'}
                    `}>
                      {guest.rsvp_status === 'confirmed' && <Check className="w-2.5 h-2.5" />}
                      {guest.rsvp_status === 'confirmed' ? 'Confirmed' :
                        guest.rsvp_status === 'declined' ? 'Declined' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center border-r border-stone-200">
                    <button
                      onClick={() => {
                        if (window.confirm(`Reset RSVP status for ${guest.name}?`)) {
                          onInlineSave(guest, 'rsvp_status', 'pending');
                        }
                      }}
                      className="p-1 text-stone-400 hover:text-orange-500"
                      title="Reset RSVP"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Extra empty rows for quick adding */}
              {[...Array(5)].map((_, index) => (
                <tr key={`empty-${index}`} className="hover:bg-green-50/30 group">
                  <td className="px-2 py-2 text-center text-stone-300 bg-stone-50 border-r border-stone-200 select-none text-xs italic">
                    New
                  </td>
                  <td className="p-0 border-r border-stone-200 relative">
                    <input
                      type="text"
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          onInlineCreate(index, 'name', e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all font-medium text-stone-800 placeholder-stone-300"
                      placeholder="+ Add Name..."
                    />
                  </td>
                  <td className="p-0 border-r border-stone-200 relative">
                    <input
                      type="email"
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          onInlineCreate(index, 'email', e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all text-stone-600 placeholder-stone-300"
                      placeholder="Email..."
                    />
                  </td>
                  <td className="p-0 border-r border-stone-200 relative">
                    <input
                      type="text"
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          onInlineCreate(index, 'phone', e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full h-10 px-3 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all text-stone-600 placeholder-stone-300"
                      placeholder="Phone..."
                    />
                  </td>
                  <td className="p-0 border-r border-stone-200 relative bg-stone-50/50"></td>
                  <td className="p-0 border-r border-stone-200 relative bg-stone-50/50"></td>
                  <td className="p-0 border-r border-stone-200 relative bg-stone-50/50"></td>
                  <td className="px-3 py-2 text-stone-400 border-r border-stone-200 font-mono text-xs bg-stone-50/50"></td>
                  <td className="px-3 py-2 text-stone-400 border-r border-stone-200 font-mono text-xs bg-stone-50/50"></td>
                  <td className="px-3 py-2 text-xs bg-stone-50/50"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-stone-300 text-[#A67B5B] focus:ring-[#A67B5B]"
                    checked={selectedIds.length === filteredGuests.length && filteredGuests.length > 0}
                    onChange={onToggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Group</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Plus Ones</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">RSVP Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-stone-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pagedGuests.map(guest => (
                <tr key={guest.id} className={`hover:bg-stone-50/50 ${selectedIds.includes(guest.id) ? 'bg-stone-50' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-stone-300 text-[#A67B5B] focus:ring-[#A67B5B]"
                      checked={selectedIds.includes(guest.id)}
                      onChange={() => onToggleSelect(guest.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-stone-800">{guest.name}</div>
                      {guest.parent_guest_id && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] uppercase font-bold rounded">Plus One</span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-stone-400 mt-0.5 uppercase tracking-wider">Code: {guest.unique_code || '—'}</div>
                    {guest.parent_guest_id && guest.parent_guest && (
                      <div className="text-[10px] text-stone-400 italic">Guest of: {guest.parent_guest.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {guest.email && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-500">
                          <Mail className="w-2.5 h-2.5 text-stone-400" />
                          {guest.email}
                        </div>
                      )}
                      {guest.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
                          <MessageCircle className="w-2.5 h-2.5 text-green-500" />
                          {guest.phone}
                        </div>
                      )}
                      {!guest.email && !guest.phone && <span className="text-[10px] text-stone-300 italic">No contact info</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 capitalize">
                      {guest.group}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {guest.plus_ones && guest.plus_ones.length > 0 ? (
                      <div>
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                          +{guest.plus_ones.length}
                        </span>
                        <div className="text-xs text-stone-500 mt-1">
                          {guest.plus_ones.map(po => po.name).join(', ')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex w-fit whitespace-nowrap items-center gap-1 ${
                      guest.rsvp_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        guest.rsvp_status === 'declined' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                    }`}>
                      {guest.rsvp_status === 'confirmed' && <Check className="w-2.5 h-2.5" />}
                      {guest.rsvp_status === 'confirmed' ? 'Confirmed' :
                        guest.rsvp_status === 'declined' ? 'Declined' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onInviteRequest(guest)}
                        className="p-1 text-stone-400 hover:text-[#A67B5B]"
                        title="Manage Invitation"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button onClick={() => onEdit(guest)} className="p-1 text-stone-400 hover:text-[#A67B5B]"><Edit className="w-4 h-4" /></button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Reset RSVP status for ${guest.name}?`)) {
                            onUpdateGuest(guest, { rsvp_status: 'pending', rsvp_message: null, dietary_notes: null });
                          }
                        }}
                        className="p-1 text-stone-400 hover:text-orange-500"
                        title="Reset RSVP"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(guest.id)} className="p-1 text-stone-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-stone-100 bg-white px-4 py-3 sm:px-6 rounded-b-2xl">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-stone-700">
                Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredGuests.length)}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredGuests.length)}</span> of <span className="font-medium">{filteredGuests.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button onClick={() => onSetCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-stone-400 ring-1 ring-inset ring-stone-300 hover:bg-stone-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
                  <span className="sr-only">Previous</span>
                  &larr;
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i + 1} onClick={() => onSetCurrentPage(i + 1)} className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === i + 1 ? 'z-10 bg-[#A67B5B] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A67B5B]' : 'text-stone-900 ring-1 ring-inset ring-stone-300 hover:bg-stone-50 focus:z-20 focus:outline-offset-0'}`}> {i + 1} </button>
                ))}
                <button onClick={() => onSetCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-stone-400 ring-1 ring-inset ring-stone-300 hover:bg-stone-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
                  <span className="sr-only">Next</span>
                  &rarr;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </AdminCard>
  );
}
