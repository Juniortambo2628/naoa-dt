import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MapPin, Plus, Trash2, Edit, Save, X, Loader2 } from 'lucide-react';
import { scheduleService } from '../../services/api';
import AdminPageHero from '../../components/admin/AdminPageHero';

export default function AdminSchedule() {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false); // For creating/editing events
  const [selectedItem, setSelectedItem] = useState(null); // If editing a schedule item
  const [selectedEvent, setSelectedEvent] = useState(null); // If editing a main event
  const [targetEventId, setTargetEventId] = useState(null); // Which event to add item to

  const fetchSchedule = async () => {
    try {
      const response = await scheduleService.getSchedule();
      setEvents(response.data || []);
      // Default to first event for adding items if available
      if (response.data && response.data.length > 0) {
        setTargetEventId(response.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching schedule:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleAddItem = (eventId) => {
    setSelectedItem(null);
    setTargetEventId(eventId);
    setModalOpen(true);
  };

  const handleCreateEvent = () => {
      setSelectedEvent(null);
      setEventModalOpen(true);
  };

  const handleEditEvent = (event) => {
      setSelectedEvent(event);
      setEventModalOpen(true);
  };

  const handleDeleteEvent = async (eventId) => {
      if (window.confirm('Are you sure you want to delete this event? This will also delete all its schedule items.')) {
          try {
              await scheduleService.deleteEvent(eventId);
              fetchSchedule();
          } catch (err) {
              console.error(err);
              alert('Failed to delete event');
          }
      }
  };

  const handleEditItem = (item, eventId) => {
    setSelectedItem(item);
    setTargetEventId(eventId);
    setModalOpen(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Delete this schedule item?')) {
      try {
        await scheduleService.deleteItem(itemId); 
        fetchSchedule();
      } catch (err) {
        console.error(err);
        alert('Failed to delete item');
      }
    }
  };

  const handleSaveItem = async (data) => {
    if (selectedItem) {
        await scheduleService.updateItem(selectedItem.id, data);
    } else {
        await scheduleService.createItem(targetEventId, data);
    }
    fetchSchedule();
  };

  const handleSaveEvent = async (data) => {
      try {
        if (selectedEvent) {
            await scheduleService.updateEvent(selectedEvent.id, data);
        } else {
            await scheduleService.createEvent(data);
        }
        fetchSchedule();
      } catch (e) {
        console.error(e);
        alert('Failed to save event');
      }
  };

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Schedule Management"
        breadcrumb={[
          { label: 'Dashboard', path: '/admin/dashboard' },
          { label: 'Schedule' },
        ]}
        icon={<Calendar className="w-5 h-5 text-[#A67B5B]" />}
        actions={
          <button onClick={handleCreateEvent} className="btn-primary flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Add Event Data
          </button>
        }
      />

      {loading ? (
        <p>Loading...</p>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-100">
            <p className="text-stone-500 mb-4">No events found. Create an event to start building the schedule.</p>
            <button onClick={handleCreateEvent} className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create First Event
            </button>
        </div>
      ) : (
        <div className="space-y-8">
            {events.map(event => (
                <div key={event.id} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className="text-xl font-medium text-[#4A3F35]">{event.name}</h2>
                                <p className="text-stone-500">{new Date(event.event_date).toLocaleDateString()} • {event.venue}</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleEditEvent(event)}
                                    className="p-2 text-stone-400 hover:text-[#A67B5B] rounded-lg transition-colors"
                                    title="Edit Event"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className="p-2 text-stone-400 hover:text-red-500 rounded-lg transition-colors"
                                    title="Delete Event"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleAddItem(event.id)}
                            className="btn-secondary flex items-center gap-2 text-sm"
                        >
                            <Plus className="w-4 h-4" /> Add Item
                        </button>
                    </div>

                    <div className="space-y-3">
                        {event.schedule_items && event.schedule_items.filter(i => i.status !== 'deleted').map(item => (
                            <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                                <div className="w-16 text-center">
                                    <p className="font-bold text-[#A67B5B]">{item.start_time.slice(0,5)}</p>
                                    <p className="text-xs text-stone-400">{item.end_time?.slice(0,5)}</p>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-stone-800">{item.title}</h3>
                                    <p className="text-sm text-stone-500 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {item.location}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleEditItem(item, event.id)}
                                        className="p-2 text-stone-400 hover:text-[#A67B5B] rounded-lg"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="p-2 text-stone-400 hover:text-red-500 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(!event.schedule_items || event.schedule_items.filter(i => i.status !== 'deleted').length === 0) && (
                            <p className="text-center text-stone-400 py-4">No items scheduled yet.</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
      )}

      <ScheduleModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveItem}
        item={selectedItem}
      />

      <EventModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onSave={handleSaveEvent}
        event={selectedEvent}
      />
    </div>
  );
}

function EventModal({ isOpen, onClose, onSave, event }) {
    const [formData, setFormData] = useState({
        name: '',
        event_date: '',
        event_time: '14:00', // Default start time
        venue: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (event) {
            setFormData({
                name: event.name || '',
                event_date: event.event_date || '',
                event_time: event.event_time?.slice(0,5) || '14:00',
                venue: event.venue || '',
                description: event.description || ''
            });
        } else {
            setFormData({ name: '', event_date: '', event_time: '14:00', venue: '', description: '' });
        }
    }, [event, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch(e) { console.error(e); }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-medium text-[#4A3F35]">Add Major Event</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-stone-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Event Name</label>
                        <input required placeholder="e.g. Wedding Day" className="input-field w-full p-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Date</label>
                            <input type="date" required className="input-field w-full p-2 border rounded-lg" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Start Time</label>
                            <input type="time" required className="input-field w-full p-2 border rounded-lg" value={formData.event_time} onChange={e => setFormData({...formData, event_time: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Venue Name</label>
                        <input required className="input-field w-full p-2 border rounded-lg" value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                        <textarea className="input-field w-full p-2 border rounded-lg" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <div className="flex justify-end pt-4">
                         <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center items-center gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {event ? 'Update Event' : 'Create Event'}
                         </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ScheduleModal({ isOpen, onClose, onSave, item }) {
    const [formData, setFormData] = useState({
        title: '',
        start_time: '',
        end_time: '',
        description: '',
        location: '',
        type: 'ceremony'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setFormData({
                title: item.title || '',
                start_time: item.start_time?.slice(0,5) || '',
                end_time: item.end_time?.slice(0,5) || '',
                description: item.description || '',
                location: item.location || '',
                type: item.type || 'ceremony'
            });
        } else {
            setFormData({ title: '', start_time: '', end_time: '', description: '', location: '', type: 'ceremony' });
        }
    }, [item, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch(e) { console.error(e); alert('Failed to save'); }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-medium text-[#4A3F35]">{item ? 'Edit Event' : 'Add Event'}</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-stone-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Title</label>
                        <input required className="input-field w-full p-2 border rounded-lg" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Start Time</label>
                            <input type="time" required className="input-field w-full p-2 border rounded-lg" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">End Time</label>
                            <input type="time" className="input-field w-full p-2 border rounded-lg" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Location</label>
                        <input className="input-field w-full p-2 border rounded-lg" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                        <textarea className="input-field w-full p-2 border rounded-lg" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <div className="flex justify-end pt-4">
                         <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center items-center gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Event
                         </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
