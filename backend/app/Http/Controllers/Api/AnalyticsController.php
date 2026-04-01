<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guest;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    /**
     * Get RSVP statistics for dashboard
     */
    public function getStats()
    {
        $guests = Guest::all();
        
        // RSVP Status breakdown
        $rsvpStatus = [
            ['name' => 'Confirmed', 'value' => $guests->where('rsvp_status', 'confirmed')->count(), 'color' => '#22c55e'],
            ['name' => 'Pending', 'value' => $guests->where('rsvp_status', 'pending')->count(), 'color' => '#f59e0b'],
            ['name' => 'Declined', 'value' => $guests->where('rsvp_status', 'declined')->count(), 'color' => '#ef4444'],
        ];
        
        
        // Group breakdown
        $groups = $guests->groupBy('group')->map(fn($g, $name) => [
            'name' => $name ?: 'Unassigned',
            'value' => $g->count()
        ])->values()->toArray();
        
        // Summary stats
        $summary = [
            'totalGuests' => $guests->count(),
            'totalConfirmed' => $guests->where('rsvp_status', 'confirmed')->count(),
            'totalPlusOnes' => $guests->whereNotNull('parent_guest_id')->count(),
            'expectedAttendees' => $guests->where('rsvp_status', 'confirmed')->count(),
            'pendingResponses' => $guests->where('rsvp_status', 'pending')->count(),
            'checkedIn' => $guests->whereNotNull('checked_in_at')->count(),
        ];
        
        // Timeline of RSVPs (based on updated_at for confirmed guests)
        // Groups by date (Y-m-d) and counts them to show a line graph
        $timeline = $guests->where('rsvp_status', 'confirmed')
            ->groupBy(fn($g) => $g->updated_at->format('Y-m-d'))
            ->map(fn($g, $date) => [
                'date' => $date,
                'count' => $g->count()
            ])
            ->values()
            ->sortBy('date')
            ->toArray();

        // Cumulative sum for the timeline
        $cumulative = 0;
        foreach ($timeline as &$point) {
            $cumulative += $point['count'];
            $point['total'] = $cumulative;
        }

        return response()->json([
            'rsvpStatus' => $rsvpStatus,
            'groups' => $groups,
            'summary' => $summary,
            'timeline' => array_values($timeline)
        ]);
    }
}
