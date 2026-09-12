import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hotel, Plane, Car, FileText, Upload, Download, Trash2, 
  Check, Loader2, ChevronDown, ChevronUp, Calendar, MapPin 
} from 'lucide-react';
import { guestService } from '../services/api';
import { getAssetUrl } from '../utils/assetUrl';

const TRANSPORT_OPTIONS = [
  { value: 'rental-car', label: 'Rental Car', icon: '🚗' },
  { value: 'taxi', label: 'Taxi', icon: '🚕' },
  { value: 'rideshare', label: 'Rideshare (Uber/Bolt)', icon: '📱' },
  { value: 'public', label: 'Public Transport', icon: '🚌' },
  { value: 'shuttle', label: 'Shuttle', icon: '🚐' },
  { value: 'other', label: 'Other', icon: '🚗' },
];

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-stone-50 hover:bg-stone-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-[#A67B5B]" />
          <span className="font-medium text-stone-700">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-stone-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-stone-400" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GuestTravelForm({ guestCode, onSuccess }) {
  const [travelData, setTravelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Accommodation state
  const [hotel, setHotel] = useState({
    name: '',
    address: '',
    check_in: '',
    check_out: '',
    confirmation: '',
    notes: '',
  });

  // Flight state
  const [flight, setFlight] = useState({
    airline: '',
    number: '',
    departure: '',
    arrival: '',
    departure_airport: '',
    arrival_airport: '',
    confirmation: '',
    notes: '',
  });

  // Transport state
  const [transport, setTransport] = useState({
    method: '',
    notes: '',
  });

  // Ticket state
  const [ticket, setTicket] = useState(null);
  const [uploadingTicket, setUploadingTicket] = useState(false);

  // Fetch existing travel data
  useEffect(() => {
    const fetchTravel = async () => {
      try {
        const res = await guestService.getTravel(guestCode);
        const data = res.data?.travel || res.data;
        
        if (data) {
          setTravelData(data);
          
          // Populate form fields
          setHotel({
            name: data.hotel_name || '',
            address: data.hotel_address || '',
            check_in: data.hotel_check_in ? data.hotel_check_in.split('T')[0] : '',
            check_out: data.hotel_check_out ? data.hotel_check_out.split('T')[0] : '',
            confirmation: data.hotel_confirmation || '',
            notes: data.hotel_notes || '',
          });

          setFlight({
            airline: data.airline || '',
            number: data.flight_number || '',
            departure: data.flight_departure ? data.flight_departure.replace('Z', '').slice(0, 16) : '',
            arrival: data.flight_arrival ? data.flight_arrival.replace('Z', '').slice(0, 16) : '',
            departure_airport: data.flight_departure_airport || '',
            arrival_airport: data.flight_arrival_airport || '',
            confirmation: data.flight_confirmation || '',
            notes: data.flight_notes || '',
          });

          setTransport({
            method: data.transport_method || '',
            notes: data.transport_notes || '',
          });

          if (data.ticket_file_path) {
            setTicket({
              path: data.ticket_file_path,
              name: data.ticket_file_name,
              type: data.ticket_file_type,
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch travel details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTravel();
  }, [guestCode]);

  // Save travel details
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const data = {
        // Accommodation
        hotel_name: hotel.name || null,
        hotel_address: hotel.address || null,
        hotel_check_in: hotel.check_in || null,
        hotel_check_out: hotel.check_out || null,
        hotel_confirmation: hotel.confirmation || null,
        hotel_notes: hotel.notes || null,
        // Flight
        airline: flight.airline || null,
        flight_number: flight.number || null,
        flight_departure: flight.departure || null,
        flight_arrival: flight.arrival || null,
        flight_departure_airport: flight.departure_airport || null,
        flight_arrival_airport: flight.arrival_airport || null,
        flight_confirmation: flight.confirmation || null,
        flight_notes: flight.notes || null,
        // Transport
        transport_method: transport.method || null,
        transport_notes: transport.notes || null,
      };

      await guestService.saveTravel(guestCode, data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Handle ticket upload
  const handleTicketUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTicket(true);
    try {
      const res = await guestService.uploadTicket(guestCode, file);
      setTicket({
        path: res.data?.ticket_file_path || res.data?.path,
        name: res.data?.ticket_file_name || file.name,
        type: res.data?.ticket_file_type || file.name.split('.').pop(),
      });
    } catch (err) {
      setError('Failed to upload ticket');
    } finally {
      setUploadingTicket(false);
    }
  };

  // Handle ticket delete
  const handleTicketDelete = async () => {
    try {
      await guestService.deleteTicket(guestCode);
      setTicket(null);
    } catch (err) {
      setError('Failed to delete ticket');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-stone-300 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-800">My Travel Details</h3>
            <p className="text-xs text-stone-400">Save your accommodation & flight info for easy reference</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Accommodation Section */}
        <CollapsibleSection 
          title="Accommodation" 
          icon={Hotel}
          defaultOpen={!!hotel.name}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Hotel Name</label>
              <input
                type="text"
                value={hotel.name}
                onChange={(e) => setHotel({ ...hotel, name: e.target.value })}
                placeholder="e.g. Hilton Nairobi"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Confirmation #</label>
              <input
                type="text"
                value={hotel.confirmation}
                onChange={(e) => setHotel({ ...hotel, confirmation: e.target.value })}
                placeholder="Booking reference"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Address</label>
            <input
              type="text"
              value={hotel.address}
              onChange={(e) => setHotel({ ...hotel, address: e.target.value })}
              placeholder="Hotel address"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Check-in
              </label>
              <input
                type="date"
                value={hotel.check_in}
                onChange={(e) => setHotel({ ...hotel, check_in: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Check-out
              </label>
              <input
                type="date"
                value={hotel.check_out}
                onChange={(e) => setHotel({ ...hotel, check_out: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Notes</label>
            <textarea
              value={hotel.notes}
              onChange={(e) => setHotel({ ...hotel, notes: e.target.value })}
              placeholder="Any additional details..."
              rows={2}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
            />
          </div>
        </CollapsibleSection>

        {/* Flight Section */}
        <CollapsibleSection 
          title="Flight Details" 
          icon={Plane}
          defaultOpen={!!flight.airline}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Airline</label>
              <input
                type="text"
                value={flight.airline}
                onChange={(e) => setFlight({ ...flight, airline: e.target.value })}
                placeholder="e.g. Kenya Airways"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Flight Number</label>
              <input
                type="text"
                value={flight.number}
                onChange={(e) => setFlight({ ...flight, number: e.target.value })}
                placeholder="e.g. KQ 100"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">From (IATA)</label>
              <input
                type="text"
                value={flight.departure_airport}
                onChange={(e) => setFlight({ ...flight, departure_airport: e.target.value.toUpperCase() })}
                placeholder="e.g. NBO"
                maxLength={3}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">To (IATA)</label>
              <input
                type="text"
                value={flight.arrival_airport}
                onChange={(e) => setFlight({ ...flight, arrival_airport: e.target.value.toUpperCase() })}
                placeholder="e.g. MBA"
                maxLength={3}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Departure</label>
              <input
                type="datetime-local"
                value={flight.departure}
                onChange={(e) => setFlight({ ...flight, departure: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Arrival</label>
              <input
                type="datetime-local"
                value={flight.arrival}
                onChange={(e) => setFlight({ ...flight, arrival: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Booking Reference</label>
            <input
              type="text"
              value={flight.confirmation}
              onChange={(e) => setFlight({ ...flight, confirmation: e.target.value })}
              placeholder="PNR or confirmation code"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Notes</label>
            <textarea
              value={flight.notes}
              onChange={(e) => setFlight({ ...flight, notes: e.target.value })}
              placeholder="Layovers, special requirements..."
              rows={2}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
            />
          </div>
        </CollapsibleSection>

        {/* Transport Section */}
        <CollapsibleSection 
          title="Transport to Venue" 
          icon={Car}
          defaultOpen={!!transport.method}
        >
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-2">How are you getting to the venue?</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {TRANSPORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTransport({ ...transport, method: option.value })}
                  className={`
                    flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left
                    ${transport.method === option.value
                      ? 'border-[#A67B5B] bg-[#A67B5B]/5'
                      : 'border-stone-200 hover:border-stone-300'}
                  `}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className={`text-sm ${transport.method === option.value ? 'font-medium text-[#A67B5B]' : 'text-stone-600'}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Notes</label>
            <textarea
              value={transport.notes}
              onChange={(e) => setTransport({ ...transport, notes: e.target.value })}
              placeholder="Car rental details, pickup time..."
              rows={2}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B]"
            />
          </div>
        </CollapsibleSection>

        {/* Ticket Upload Section */}
        <CollapsibleSection 
          title="Digital Tickets" 
          icon={FileText}
          defaultOpen={!!ticket}
        >
          {ticket ? (
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-[#A67B5B]" />
                <div>
                  <p className="text-sm font-medium text-stone-700 truncate max-w-[200px]">
                    {ticket.name || 'Ticket'}
                  </p>
                  <p className="text-xs text-stone-400 uppercase">{ticket.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getAssetUrl(`/storage/${ticket.path}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4 text-stone-600" />
                </a>
                <button
                  onClick={handleTicketDelete}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:border-[#A67B5B] hover:bg-stone-50 transition-colors">
              {uploadingTicket ? (
                <Loader2 className="w-8 h-8 text-stone-300 animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-stone-300 mb-2" />
                  <p className="text-sm text-stone-500">Upload boarding pass or ticket</p>
                  <p className="text-xs text-stone-400 mt-1">PDF, JPG, PNG (max 10MB)</p>
                </>
              )}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleTicketUpload}
                className="hidden"
                disabled={uploadingTicket}
              />
            </label>
          )}
        </CollapsibleSection>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <p className="font-medium text-green-700">Travel details saved!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-[#A67B5B] to-[#C8A68E] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Check className="w-5 h-5" />
              Save Travel Details
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
