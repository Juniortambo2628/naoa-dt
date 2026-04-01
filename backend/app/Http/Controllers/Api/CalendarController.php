<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class CalendarController extends Controller
{
    /**
     * Display a landing page with various calendar service options.
     */
    public function viewCalendarOptions(Request $request)
    {
        $weddingDate = $request->query('date', '2026-11-14');
        $venue = $request->query('venue', 'Wedding Venue');
        $title = $request->query('title', 'Our Wedding');
        
        $dateStr = str_replace('-', '', $weddingDate);
        $start = $dateStr . "T100000";
        $end = $dateStr . "T220000";
        
        // Google Calendar
        $googleUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE" .
            "&text=" . urlencode($title) .
            "&dates=" . $start . "/" . $end .
            "&details=" . urlencode("We are getting married! Save the date.") .
            "&location=" . urlencode($venue);

        // Outlook/Office 365
        $outlookUrl = "https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent" .
            "&subject=" . urlencode($title) .
            "&startdt=" . $weddingDate . "T10:00:00Z" .
            "&enddt=" . $weddingDate . "T22:00:00Z" .
            "&body=" . urlencode("We are getting married! Save the date.") .
            "&location=" . urlencode($venue);

        // Original ICS link (relative to request)
        $icsUrl = route('calendar.ics', $request->all());

        return view('calendar-add', compact('title', 'googleUrl', 'outlookUrl', 'icsUrl'));
    }

    /**
     * Generate and download an ICS file for the wedding event.
     */
    public function downloadIcs(Request $request)
    {
        $weddingDate = $request->query('date', '20261114');
        $venue = $request->query('venue', 'Wedding Venue');
        $title = $request->query('title', 'Our Wedding');
        
        // Clean date string (remove dashes if YYYY-MM-DD)
        $dateStr = str_replace('-', '', $weddingDate);
        
        $icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Antigravity//WeddingApp//EN",
            "BEGIN:VEVENT",
            "UID:" . uniqid(),
            "DTSTAMP:" . date('Ymd\THis\Z'),
            "DTSTART:" . $dateStr . "T100000",
            "DTEND:" . $dateStr . "T220000",
            "SUMMARY:" . $title,
            "DESCRIPTION:We are getting married! Save the date.",
            "LOCATION:" . $venue,
            "END:VEVENT",
            "END:VCALENDAR"
        ];

        $content = implode("\r\n", $icsContent);

        return Response::make($content, 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="wedding_save_the_date.ics"',
        ]);
    }
}
