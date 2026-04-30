@extends('emails.layout')

@section('title', $subject ?? 'Wedding Invitation')

@section('content')
    <div style="text-align: center;">
        <h2 style="font-size: 24px; color: #4A3F35; margin-bottom: 20px;">Dear {{ $guest->name }},</h2>
        
        <p style="font-size: 16px; color: #6B5E53; line-height: 1.8; margin-bottom: 20px;">
            {!! nl2br(e($messageText)) !!}
        </p>

        <div style="background-color: #F8F5F2; padding: 25px; border-radius: 16px; margin-bottom: 30px; border: 1px solid #F0ECE9;">
            <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #8C8279; font-weight: bold;">Your Personal RSVP Code</p>
            <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #A67B5B; letter-spacing: 6px;">{{ $rsvpCode }}</p>
        </div>

        <div class="button-wrapper">
            <a href="{{ $rsvpUrl }}" class="button">View Invitation & RSVP</a>
        </div>

        @php
            $countdown = \App\Models\PageContent::where('section_key', 'countdown')->first();
            $dateRaw = $countdown->content['wedding_date'] ?? '2026-11-14';
            $dateClean = str_replace(['-', ':', ' '], '', substr($dateRaw, 0, 16));
            
            $homeHero = \App\Models\PageContent::where('section_key', 'home_hero')->first();
            $venue = $homeHero->content['venue']['en'] ?? ($homeHero->content['venue'] ?? 'The Grand Estate');
            $title = "Dinah & Tze Ren's Wedding";
            
            $googleCalendarUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE" . 
                "&text=" . urlencode($title) . 
                "&dates=" . $dateClean . "/" . $dateClean . 
                "&location=" . urlencode($venue) . 
                "&details=" . urlencode("We are so happy to share our special day with you!");
            
            $icsUrl = config('app.url') . "/api/calendar/ics?date=" . $dateRaw . "&venue=" . urlencode($venue) . "&title=" . urlencode($title);
        @endphp

        <div style="margin-top: 30px; padding: 20px; border-top: 1px solid #F0ECE9;">
            <p style="font-size: 13px; color: #8C8279; margin-bottom: 15px;">📅 Add this celebration to your calendar:</p>
            <div style="text-align: center;">
                <a href="{{ $googleCalendarUrl }}" target="_blank" style="display: inline-block; font-size: 12px; color: #A67B5B; text-decoration: none; padding: 10px 20px; border: 1px solid #A67B5B; border-radius: 50px; margin: 5px;">Google Calendar</a>
                <a href="{{ $icsUrl }}" target="_blank" style="display: inline-block; font-size: 12px; color: #A67B5B; text-decoration: none; padding: 10px 20px; border: 1px solid #A67B5B; border-radius: 50px; margin: 5px;">Apple / Outlook (.ics)</a>
            </div>
        </div>

        <p style="font-size: 12px; color: #A67B5B; margin-top: 25px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
            📎 A personalized invitation card is attached
        </p>
        
        <p style="font-size: 14px; color: #8C8279; margin-top: 40px; font-style: italic;">
            Please respond by {{ $rsvpDeadline }}.
        </p>
    </div>
@endsection
