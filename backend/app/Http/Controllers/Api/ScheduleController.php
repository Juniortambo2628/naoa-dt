<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\ScheduleItem;
use App\Models\LiveUpdate;
use App\Models\Guest;
use App\Notifications\ScheduleChangedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class ScheduleController extends Controller
{
    /**
     * Get the wedding schedule
     */
    public function index()
    {
        $events = Event::with(['scheduleItems.liveUpdates'])
            ->orderBy('event_date')
            ->get();

        return response()->json($events);
    }

    /**
     * Get schedule items for an event
     */
    public function getSchedule(Event $event = null)
    {
        $query = ScheduleItem::with('liveUpdates');
        
        if ($event) {
            $query->where('event_id', $event->id);
        }
        
        return response()->json($query->orderBy('order')->get());
    }

    /**
     * Get all live updates
     */
    public function getLiveUpdates()
    {
        $updates = LiveUpdate::with('scheduleItem')
            ->latest()
            ->take(20)
            ->get();

        return response()->json($updates);
    }

    /**
     * Update a schedule item status (admin)
     */
    public function updateItem(Request $request, ScheduleItem $scheduleItem)
    {
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'description' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'status' => 'sometimes|in:upcoming,current,completed',
        ]);

        $scheduleItem->update($request->only([
            'title', 'start_time', 'end_time', 'description', 'location', 'status'
        ]));

        // If setting to current, set all others to upcoming or completed
        if ($request->status === 'current') {
            ScheduleItem::where('id', '!=', $scheduleItem->id)
                ->where('event_id', $scheduleItem->event_id)
                ->where('order', '<', $scheduleItem->order)
                ->update(['status' => 'completed']);
                
            ScheduleItem::where('id', '!=', $scheduleItem->id)
                ->where('event_id', $scheduleItem->event_id)
                ->where('order', '>', $scheduleItem->order)
                ->update(['status' => 'upcoming']);
        }

        // Notify confirmed guests of schedule changes
        if ($request->has('notify_guests') && $request->notify_guests) {
            $confirmedGuests = Guest::where('rsvp_status', 'confirmed')
                ->whereNotNull('email')
                ->get();

            Notification::send($confirmedGuests, new ScheduleChangedNotification(
                'updated',
                $scheduleItem->title,
                [
                    'time' => $scheduleItem->start_time,
                    'location' => $scheduleItem->location,
                    'description' => $scheduleItem->description,
                ]
            ));
        }

        return response()->json($scheduleItem->fresh());
    }

    /**
     * Post a live update (admin)
     */
    public function postUpdate(Request $request)
    {
        $request->validate([
            'schedule_item_id' => 'nullable|exists:schedule_items,id',
            'message' => 'required|string|max:500',
            'type' => 'in:normal,important,alert',
        ]);

        $update = LiveUpdate::create([
            'schedule_item_id' => $request->schedule_item_id,
            'message' => $request->message,
            'type' => $request->type ?? 'normal',
        ]);

        // Broadcast live update event here if using Reverb
        // event(new LiveUpdatePosted($update));

        return response()->json($update, 201);
    }

    /**
     * Create event (admin)
     */
    public function storeEvent(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'event_date' => 'required|date',
            'event_time' => 'required|date_format:H:i',
            'venue' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $event = Event::create($request->all());

        return response()->json($event, 201);
    }

    /**
     * Update an event (admin)
     */
    public function updateEvent(Request $request, Event $event)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'event_date' => 'sometimes|date',
            'event_time' => 'sometimes|date_format:H:i',
            'venue' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        $event->update($request->all());

        return response()->json($event);
    }

    /**
     * Delete an event (admin)
     */
    public function destroyEvent(Event $event)
    {
        $event->scheduleItems()->delete();
        $event->delete();

        return response()->json(['message' => 'Event deleted successfully']);
    }

    /**
     * Add schedule item to event (admin)
     */
    public function storeScheduleItem(Request $request, Event $event)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'description' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:50',
        ]);

        $order = $event->scheduleItems()->max('order') + 1;

        $item = $event->scheduleItems()->create([
            ...$request->only(['title', 'start_time', 'end_time', 'description', 'location', 'type']),
            'order' => $order,
        ]);

        return response()->json($item, 201);
    }

    /**
     * Delete a schedule item (admin)
     */
    public function destroyItem(ScheduleItem $scheduleItem)
    {
        $scheduleItem->delete();

        return response()->json(['message' => 'Item deleted successfully']);
    }
}
