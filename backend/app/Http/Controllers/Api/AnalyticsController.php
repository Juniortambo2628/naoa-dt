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
        // RSVP Status breakdown via DB aggregation
        $rsvpCounts = Guest::selectRaw('rsvp_status, COUNT(*) as count')
            ->groupBy('rsvp_status')
            ->pluck('count', 'rsvp_status');

        $rsvpStatus = [
            ['name' => 'Confirmed', 'value' => $rsvpCounts->get('confirmed', 0), 'color' => '#22c55e'],
            ['name' => 'Pending', 'value' => $rsvpCounts->get('pending', 0), 'color' => '#f59e0b'],
            ['name' => 'Declined', 'value' => $rsvpCounts->get('declined', 0), 'color' => '#ef4444'],
        ];

        // Group breakdown via DB aggregation
        $groups = Guest::selectRaw('`group` as grp, COUNT(*) as count')
            ->groupBy('grp')
            ->pluck('count', 'grp')
            ->map(fn($count, $name) => [
                'name' => $name ?: 'Unassigned',
                'value' => $count,
            ])
            ->values()
            ->toArray();

        // Summary stats via DB counts
        $totalGuests = Guest::count();
        $totalConfirmed = $rsvpCounts->get('confirmed', 0);
        $pendingResponses = $rsvpCounts->get('pending', 0);
        $totalPlusOnes = Guest::whereNotNull('parent_guest_id')->count();
        $checkedIn = Guest::whereNotNull('checked_in_at')->count();

        $summary = [
            'totalGuests' => $totalGuests,
            'totalConfirmed' => $totalConfirmed,
            'totalPlusOnes' => $totalPlusOnes,
            'expectedAttendees' => $totalConfirmed,
            'pendingResponses' => $pendingResponses,
            'checkedIn' => $checkedIn,
        ];

        // Timeline of RSVPs via DB aggregation
        $timeline = Guest::where('rsvp_status', 'confirmed')
            ->selectRaw('DATE(updated_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('count', 'date')
            ->map(fn($count, $date) => [
                'date' => $date,
                'count' => $count,
            ])
            ->values()
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
            'timeline' => array_values($timeline),
        ]);
    }
}
