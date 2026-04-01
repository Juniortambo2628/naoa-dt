import { useState, useEffect, useRef } from 'react';
import { X, Save, UserPlus } from 'lucide-react';

export default function GuestModal({ isOpen, onClose, onSave, guest, allGuests = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    group: 'family',
    invitation_via: 'whatsapp',
    plus_ones_allowed: 0,
    plus_ones_data: []
  });
  const [loading, setLoading] = useState(false);
  const [activeAutocomplete, setActiveAutocomplete] = useState(null); // index of active autocomplete
  const [autocompleteFilter, setAutocompleteFilter] = useState('');

  useEffect(() => {
    if (guest) {
      const plusOnesData = (guest.plus_ones || []).map(po => ({
        id: po.id,
        name: po.name || '',
        email: po.email || '',
        existingGuestId: null
      }));
      
      setFormData({
        name: guest.name || '',
        email: guest.email || '',
        phone: guest.phone || '',
        group: guest.group || 'family',
        invitation_via: guest.invitation_via || 'whatsapp',
        plus_ones_allowed: guest.plus_ones_allowed || 0,
        plus_ones_data: plusOnesData
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        group: 'family',
        invitation_via: 'whatsapp',
        plus_ones_allowed: 0,
        plus_ones_data: []
      });
    }
  }, [guest, isOpen]);

  useEffect(() => {
    const targetCount = formData.plus_ones_allowed;
    setFormData(prev => {
      const currentData = [...prev.plus_ones_data];
      
      if (currentData.length < targetCount) {
        while (currentData.length < targetCount) {
          currentData.push({ name: '', email: '', existingGuestId: null });
        }
      } else if (currentData.length > targetCount) {
        currentData.length = targetCount;
      }
      
      return { ...prev, plus_ones_data: currentData };
    });
  }, [formData.plus_ones_allowed]);

  const updatePlusOne = (index, field, value) => {
    setFormData(prev => {
      const newData = [...prev.plus_ones_data];
      newData[index] = { ...newData[index], [field]: value };
      // Clear existingGuestId if manually typing name
      if (field === 'name') {
        newData[index].existingGuestId = null;
      }
      return { ...prev, plus_ones_data: newData };
    });
    
    if (field === 'name') {
      setAutocompleteFilter(value);
      setActiveAutocomplete(index);
    }
  };

  const selectExistingGuest = (index, existingGuest) => {
    setFormData(prev => {
      const newData = [...prev.plus_ones_data];
      newData[index] = {
        ...newData[index],
        name: existingGuest.name,
        email: existingGuest.email || '',
        existingGuestId: existingGuest.id
      };
      return { ...prev, plus_ones_data: newData };
    });
    setActiveAutocomplete(null);
    setAutocompleteFilter('');
  };

  const getFilteredSuggestions = () => {
    if (!autocompleteFilter || autocompleteFilter.length < 2) return [];
    
    const currentGuestId = guest?.id;
    const usedIds = formData.plus_ones_data
      .filter(po => po.existingGuestId)
      .map(po => po.existingGuestId);
    
    return allGuests.filter(g => {
      // Exclude current guest being edited
      if (g.id === currentGuestId) return false;
      // Exclude already selected plus ones
      if (usedIds.includes(g.id)) return false;
      // Filter by name match
      return g.name.toLowerCase().includes(autocompleteFilter.toLowerCase());
    }).slice(0, 5);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const dataToSend = {
      ...formData,
      plus_ones_data: formData.plus_ones_data.filter(po => po.name.trim())
    };
    
    await onSave(dataToSend);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  const suggestions = getFilteredSuggestions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50 sticky top-0 z-10">
          <h2 className="text-xl font-medium text-stone-800" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {guest ? 'Edit Guest' : 'Add New Guest'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B]"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email Address</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B]"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Group</label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B]"
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
              >
                <option value="family">Family</option>
                <option value="friends">Friends</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Plus Ones</label>
              <input
                type="number"
                min="0"
                max="5"
                className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B]"
                value={formData.plus_ones_allowed}
                onChange={(e) => setFormData({ ...formData, plus_ones_allowed: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Invitation Via</label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B]"
                value={formData.invitation_via}
                onChange={(e) => setFormData({ ...formData, invitation_via: e.target.value })}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label>
            <input
              type="tel"
              className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B]"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          {/* Plus Ones Details Section */}
          {formData.plus_ones_allowed > 0 && (
            <div className="pt-4 border-t border-stone-100">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="w-4 h-4 text-[#A67B5B]" />
                <span className="text-sm font-medium text-stone-700">Plus One Details</span>
              </div>
              <div className="space-y-3">
                {formData.plus_ones_data.map((plusOne, index) => (
                  <div key={index} className="p-3 bg-stone-50 rounded-lg space-y-2">
                    <div className="text-xs font-medium text-stone-500 mb-2">
                      Plus One #{index + 1}
                      {plusOne.existingGuestId && (
                        <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">
                          Linked to existing guest
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Name (type to search existing guests)"
                        className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] text-sm"
                        value={plusOne.name}
                        onChange={(e) => updatePlusOne(index, 'name', e.target.value)}
                        onFocus={() => { setActiveAutocomplete(index); setAutocompleteFilter(plusOne.name); }}
                        onBlur={() => setTimeout(() => setActiveAutocomplete(null), 200)}
                      />
                      {/* Autocomplete dropdown */}
                      {activeAutocomplete === index && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                          {suggestions.map(g => (
                            <button
                              key={g.id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-stone-50 text-sm flex items-center justify-between"
                              onMouseDown={(e) => { e.preventDefault(); selectExistingGuest(index, g); }}
                            >
                              <span className="font-medium text-stone-700">{g.name}</span>
                              <span className="text-xs text-stone-400">{g.email || 'No email'}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] text-sm"
                      value={plusOne.email}
                      onChange={(e) => updatePlusOne(index, 'email', e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-2">Each plus one receives their own RSVP code. Select existing guests to avoid duplicates.</p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[#A67B5B] text-white hover:bg-[#8B6A4E] transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
