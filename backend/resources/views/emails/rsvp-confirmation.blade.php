@extends('emails.layout')

@section('title', $subject ?? 'RSVP Confirmation')

@section('content')
    <div style="text-align: center;">
        <h2 style="font-size: 24px; color: #4A3F35; margin-bottom: 20px;">Dear {{ $guest->name }},</h2>
        
        @if(!$attending)
            <div style="font-size: 48px; margin-bottom: 20px;">💌</div>
        @endif

        <p style="font-size: 16px; color: #6B5E53; line-height: 1.8; margin-bottom: 30px;">
            {!! nl2br(e($messageText)) !!}
        </p>

        @if($attending)
            <div style="background-color: #FAF8F6; padding: 30px; border-radius: 15px; border: 1px solid #F0ECE9; margin-bottom: 40px; text-align: left;">
                <h3 style="font-size: 18px; color: #A67B5B; margin-bottom: 15px; text-align: center;">Event Details</h3>
                @php
                    $countdown = \App\Models\PageContent::where('section_key', 'countdown')->first();
                    $dateRaw = $countdown->content['wedding_date'] ?? '2026-11-14';
                    $formattedDate = \Carbon\Carbon::parse($dateRaw)->format('F jS, Y');
                    
                    $homeHero = \App\Models\PageContent::where('section_key', 'home_hero')->first();
                    $location = $homeHero->content['location'] ?? 'Nairobi, Kenya';
                    if (is_array($location)) {
                        $location = $location['en'] ?? array_values($location)[0];
                    }
                    
                    $eventDetails = \App\Models\PageContent::where('section_key', 'event_details')->first();
                    $time = $eventDetails->content['time'] ?? '2:00 PM';
                @endphp
                <div style="margin-bottom: 10px;"><strong>Date:</strong> {{ $formattedDate }}</div>
                <div style="margin-bottom: 10px;"><strong>Time:</strong> {{ $time }}</div>
                <div style="margin-bottom: 10px;"><strong>Venue:</strong> {{ $location }}</div>
                @if($guest->plus_ones_count > 0)
                    <div style="margin-bottom: 0;"><strong>Additional Guests:</strong> {{ $guest->plus_ones_count }}</div>
                @endif

                @php
                    $dateClean = str_replace(['-', ':', ' '], '', substr($dateRaw, 0, 16));
                    $title = "Dinah & Tze Ren's Wedding";
                    $googleCalendarUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE" . 
                        "&text=" . urlencode($title) . 
                        "&dates=" . $dateClean . "/" . $dateClean . 
                        "&location=" . urlencode($location) . 
                        "&details=" . urlencode("We are so happy to share our special day with you!");
                    
                    $icsUrl = config('app.url') . "/api/calendar/ics?date=" . $dateRaw . "&venue=" . urlencode($location) . "&title=" . urlencode($title);
                @endphp

                <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #F0ECE9; text-align: center;">
                    <p style="font-size: 13px; color: #8C8279; margin-bottom: 15px;">Add to Calendar:</p>
                    <a href="{{ $googleCalendarUrl }}" target="_blank" style="display: inline-block; font-size: 11px; color: #A67B5B; text-decoration: none; padding: 8px 16px; border: 1px solid #A67B5B; border-radius: 50px; margin: 5px;">Google</a>
                    <a href="{{ $icsUrl }}" target="_blank" style="display: inline-block; font-size: 11px; color: #A67B5B; text-decoration: none; padding: 8px 16px; border: 1px solid #A67B5B; border-radius: 50px; margin: 5px;">Apple / Outlook</a>
                </div>
            </div>
        @endif

        <div class="button-wrapper">
            <a href="{{ config('app.frontend_url') }}" class="button">Visit Our Wedding Site</a>
        </div>
    </div>
@endsection
