import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, Trash2, Edit, Save } from 'lucide-react';
import { useSchedule } from '../../hooks/useApiHooks';
import { scheduleService } from '../../services/api';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminListPanel from '../../components/admin/AdminListPanel';
import AdminModal from '../../components/admin/AdminModal';
import EmptyState from '../../components/admin/EmptyState';
import { useSearch } from '../../context/SearchContext';
import { AdminInput, AdminTextarea } from '../../components/admin/AdminInput';
import AdminCard from '../../components/admin/AdminCard';
import Button from '../../components/Button';
import Spinner from '../../components/admin/Spinner';
import useAdminAction from '../../hooks/useAdminAction';

export default function AdminSchedule() {
  const { data: events = [], isLoading: loading, refetch } = useSchedule();
  const [modalOpen, setModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [targetEventId, setTargetEventId] = useState(null);
  const { searchQuery } = useSearch();
  const [activeEventId, setActiveEventId] = useState(null);

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

  const deleteEvent = useAdminAction((eventId) => scheduleService.deleteEvent(eventId), {
      confirm: 'Are you sure you want to delete this event? This will also delete all its schedule items.',
      error: 'Failed to delete event',
      onSuccess: () => refetch(),
  });
  const handleDeleteEvent = deleteEvent.run;

  const handleEditItem = (item, eventId) => {
    setSelectedItem(item);
    setTargetEventId(eventId);
    setModalOpen(true);
  };

  const deleteItem = useAdminAction((itemId) => scheduleService.deleteItem(itemId), {
      confirm: 'Delete this schedule item?',
      error: 'Failed to delete item',
      onSuccess: () => refetch(),
  });
  const handleDeleteItem = deleteItem.run;

  // Saves re-throw so the form stays open when they fail.
  const saveItem = useAdminAction((data) => (selectedItem
      ? scheduleService.updateItem(selectedItem.id, data)
      : scheduleService.createItem(targetEventId, data)), {
      key: () => 'save-item',
      error: 'Failed to save',
      rethrow: true,
      onSuccess: () => refetch(),
  });
  const saveEvent = useAdminAction((data) => (selectedEvent
      ? scheduleService.updateEvent(selectedEvent.id, data)
      : scheduleService.createEvent(data)), {
      key: () => 'save-event',
      error: 'Failed to save event',
      rethrow: true,
      onSuccess: () => refetch(),
  });
  const handleSaveItem = saveItem.run;
  const handleSaveEvent = saveEvent.run;

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

  // The panel lists the events; the selected one's items are shown on the left.
  const activeEvent = filteredEvents.find(e => e.id === activeEventId) || filteredEvents[0] || null;
  const formatDate = (date) => new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <>
      <AdminPageLayout
        fill
        actions={[
          {
            id: 'add-item',
            label: 'Add Item',
            icon: Plus,
            variant: 'secondary',
            onClick: () => handleAddItem(activeEvent.id),
            hidden: !activeEvent,
          },
          { id: 'add-event', label: 'Add Major Event', icon: Calendar, onClick: handleCreateEvent },
          { id: 'edit-event', label: 'Edit Event', icon: Edit, onClick: () => handleEditEvent(activeEvent), hidden: !activeEvent },
          {
            id: 'delete-event',
            label: 'Delete Event',
            icon: Trash2,
            variant: 'danger',
            onClick: () => handleDeleteEvent(activeEvent.id),
            hidden: !activeEvent,
          },
        ]}
        hero={
          <AdminPageHero
            title="Schedule Management"
            description={`${events.length} major events scheduled`}
            breadcrumb="Schedule"
            icon={<Calendar className="w-5 h-5 text-[#A67B5B]" />}
          />
        }
        search="Search schedule…"
        panel={{
          id: 'schedule',
          title: 'Major Events',
          icon: Calendar,
          subtitle: searchQuery
            ? `${filteredEvents.length} of ${events.length} match your search`
            : `${events.length} ${events.length === 1 ? 'event' : 'events'}`,
          items: filteredEvents.map(event => ({
            id: event.id,
            label: event.name,
            description: [event.event_date && formatDate(event.event_date), event.venue].filter(Boolean).join(' · '),
            count: event.display_items.length,
          })),
          activeId: activeEvent?.id,
          onChange: setActiveEventId,
        }}
      >
        <AdminListPanel plain>
          {loading ? (
          <EmptyState loading />
        ) : !activeEvent ? (
          <EmptyState icon={Calendar} message="No events yet" searchQuery={searchQuery} action={{ label: 'Add an event', onClick: handleCreateEvent }} />
        ) : (
          <AdminCard>
              <div className="mb-5 min-w-0">
                  <h2 className="text-xl font-medium text-[#4A3F35] break-words">{activeEvent.name}</h2>
                  <p className="text-stone-500 text-sm break-words">
                      {[activeEvent.event_date && formatDate(activeEvent.event_date), activeEvent.event_time?.slice(0, 5), activeEvent.venue].filter(Boolean).join(' • ')}
                  </p>
                  {activeEvent.description && <p className="text-sm text-stone-600 mt-2">{activeEvent.description}</p>}
              </div>

              <div className="space-y-3">
                  {activeEvent.display_items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 sm:gap-4 p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                          <div className="w-14 sm:w-16 text-center flex-shrink-0">
                              <p className="font-bold text-[#A67B5B]">{item.start_time.slice(0,5)}</p>
                              <p className="text-xs text-stone-400">{item.end_time?.slice(0,5)}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-stone-800 break-words">{item.title}</h3>
                              {item.location && (
                                  <p className="text-sm text-stone-500 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="break-words min-w-0">{item.location}</span>
                                  </p>
                              )}
                          </div>
                          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                              <Button edit size="icon-sm" icon={Edit} aria-label="Edit schedule item" title="Edit"
                                  onClick={() => handleEditItem(item, activeEvent.id)}
                              />
                              <Button edit variant="danger" size="icon-sm" icon={Trash2} aria-label="Delete schedule item" title="Delete"
                                  onClick={() => handleDeleteItem(item.id)}
                              />
                          </div>
                      </div>
                  ))}
                  {activeEvent.display_items.length === 0 && (
                      <p className="text-center text-stone-400 py-4">
                          {searchQuery ? 'No matching items in this event.' : 'No items yet — use Add Item to plan this event.'}
                      </p>
                  )}
              </div>
          </AdminCard>
        )}
        </AdminListPanel>

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
        } catch {
            // Reported by the save action; keep the form open.
        }
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
                <Button edit type="submit" variant="secondary" fullWidth loading={loading} icon={Save}>{event ? 'Update Event' : 'Create Event'}</Button>
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
        } catch {
            // Reported by the save action; keep the form open.
        }
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
                <Button edit type="submit" variant="secondary" fullWidth loading={loading} icon={Save}>Save Event</Button>
            </form>
        </AdminModal>
    );
}
