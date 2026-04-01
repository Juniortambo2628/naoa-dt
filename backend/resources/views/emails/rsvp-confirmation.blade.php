@extends('emails.layout')

@section('title', $subject ?? 'RSVP Confirmation')

@section('content')
    <div style="text-align: center;">
        <h2 style="font-size: 24px; color: #4A3F35; margin-bottom: 20px;">Dear {{ $guest->name }},</h2>
        
        @if($attending)
            <div style="font-size: 48px; margin-bottom: 20px;">💒</div>
        @else
            <div style="font-size: 48px; margin-bottom: 20px;">💌</div>
        @endif

        <p style="font-size: 16px; color: #6B5E53; line-height: 1.8; margin-bottom: 30px;">
            {!! nl2br(e($messageText)) !!}
        </p>

        @if($attending)
            <div style="background-color: #FAF8F6; padding: 30px; border-radius: 15px; border: 1px solid #F0ECE9; margin-bottom: 40px; text-align: left;">
                <h3 style="font-size: 18px; color: #A67B5B; margin-bottom: 15px; text-align: center;">Event Details</h3>
                <div style="margin-bottom: 10px;"><strong>Date:</strong> June 15th, 2025</div>
                <div style="margin-bottom: 10px;"><strong>Time:</strong> 2:00 PM</div>
                <div style="margin-bottom: 10px;"><strong>Venue:</strong> Garden Pavilion, Nairobi</div>
                @if($guest->plus_ones_count > 0)
                    <div style="margin-bottom: 0;"><strong>Additional Guests:</strong> {{ $guest->plus_ones_count }}</div>
                @endif
            </div>
        @endif

        <div class="button-wrapper">
            <a href="{{ config('app.frontend_url') }}" class="button">Visit Our Wedding Site</a>
        </div>
    </div>
@endsection
