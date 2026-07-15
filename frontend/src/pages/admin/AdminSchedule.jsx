import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MapPin, Plus, Trash2, Edit, Save } from 'lucide-react';
import { useSchedule } from '../../hooks/useApiHooks';
import { scheduleService } from '../../services/api';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminToolbar from '../../components/admin/AdminToolbar';
import AdminFloatingToolbar from '../../components/admin/AdminFloatingToolbar';
import AdminModal from '../../components/admin/AdminModal';
import EmptyState from '../../components/admin/EmptyState';
import { useSearch } from '../../context/SearchContext';
import useFilteredItems from '../../hooks/useFilteredItems';
import { AdminInput, AdminTextarea } from '../../components/admin/AdminInput';
import AdminCard from '../../components/admin/AdminCard';
import SubmitButton from '../../components/admin/SubmitButton';
import Spinner from '../../components/admin/Spinner';

/* Force refresh: 2026-04-15 06:36 - Critical fix for ReferenceError */
export default function AdminSchedule() {
  const { t } = useTranslation();
  const { data: events = [], isLoading: loading, refetch } = useSchedule();
  const [modalOpen, setModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [targetEventId, setTargetEventId] = useState(null);
  const { searchQuery, setSearchQuery } = useSearch();

  useEffect(() => {
    if (events.length > 0 && !targetEventId) {
      setTargetEventId(events[0].id);
    }
  }, [events, targetEventId]);

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
              refetch();
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
        refetch();
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
    refetch();
  };

  const handleSaveEvent = async (data) => {
      try {
        if (selectedEvent) {
            await scheduleService.updateEvent(selectedEvent.id, data);
        } else {
            await scheduleService.createEvent(data);
        }
        refetch();
      } catch (e) {
        console.error(e);
        alert('Failed to save event');
      }
  };

  const filteredEvents = events.map(event => {
      const activeSearch = searchQuery || '';
      const searchLower = activeSearch.toLowerCase();
      
      const filteredItems = (event.schedule_items || []).filter(item => 
          item.status !== 'deleted' && (
              item.title.toLowerCase().includes(searchLower) || 
              (item.location && item.location.toLowerCase().includes(searchLower))
          )
      );

      const matchesEvent = event.name.toLowerCase().includes(searchLower) || 
                           (event.venue && event.venue.toLowerCase().includes(searchLower));

      if (matchesEvent || filteredItems.length > 0) {
          return { ...event, display_items: filteredItems, visible: true };
      }
      return { ...event, visible: false };
  }).filter(e => e.visible);

  return (
    <>
      <AdminPageLayout
        hero={
          <AdminPageHero
            title="Schedule Management"
            description={`${events.length} major events scheduled`}
            breadcrumb="Schedule"
            icon={<Calendar className="w-5 h-5 text-[#A67B5B]" />}
          />
        }
        toolbar={
          <AdminToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search events, venues, or schedule items..."
          />
        }
      >
        {loading ? (
        <EmptyState loading />
      ) : filteredEvents.length === 0 ? (
        <EmptyState icon={Calendar} message={searchQuery ? 'No matching schedule items found' : 'No events yet'} searchQuery={searchQuery} />
      ) : (
        <div className="space-y-8">
            {filteredEvents.map(event => (
                <AdminCard key={event.id}>
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
                        {event.display_items.map(item => (
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
                        {event.display_items.length === 0 && (
                            <p className="text-center text-stone-400 py-4">No matching items in this group.</p>
                        )}
                    </div>
                </AdminCard>
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
      </AdminPageLayout>
      <AdminFloatingToolbar
        actions={[
          {
            id: 'add-event',
            label: 'Add Major Event',
            icon: Calendar,
            variant: 'primary',
            onClick: handleCreateEvent,
          },
        ]}
      />
    </>
  );
}

function EventModal({ isOpen, onClose, onSave, event }) {
    const [formData, setFormData] = useState({
        name: '',
        event_date: '',
        event_time: '14:00',
        venue: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (event) {
            setFormData({
                name: event.name || '',
                event_date: event.event_date ? event.event_date.split('T')[0] : '',
                event_time: event.event_time?.slice(0,5) || '14:00',
                venue: event.venue || '',
                description: event.description || ''
            });
        } else {
            setFormData({ 
                name: '', 
                event_date: new Date().toISOString().split('T')[0], 
                event_time: '14:00', 
                venue: '', 
                description: '' 
            });
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

    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title="Add Major Event" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <AdminInput label="Event Name" required placeholder="e.g. Wedding Day" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                    <AdminInput label="Date" type="date" required value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} />
                    <AdminInput label="Start Time" type="time" required value={formData.event_time} onChange={e => setFormData({...formData, event_time: e.target.value})} />
                </div>
                <AdminInput label="Venue Name" required value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
                <AdminTextarea label="Description" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <SubmitButton loading={loading} icon={<Save className="w-4 h-4" />} label={event ? 'Update Event' : 'Create Event'} />
            </form>
        </AdminModal>
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
            setFormData({ 
                title: '', 
                start_time: '', 
                end_time: '', 
                description: '', 
                location: '', 
                type: 'ceremony' 
            });
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

    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Event' : 'Add Event'} size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <AdminInput label="Title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                    <AdminInput label="Start Time" type="time" required value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                    <AdminInput label="End Time" type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                </div>
                <AdminInput label="Location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                <AdminTextarea label="Description" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <SubmitButton loading={loading} icon={<Save className="w-4 h-4" />} label="Save Event" />
            </form>
        </AdminModal>
    );
}
