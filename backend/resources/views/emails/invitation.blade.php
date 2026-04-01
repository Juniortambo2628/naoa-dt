@extends('emails.layout')

@section('title', $subject ?? 'Wedding Invitation')

@section('content')
    <div style="text-align: center;">
        <h2 style="font-size: 24px; color: #4A3F35; margin-bottom: 20px;">Dear {{ $guest->name }},</h2>
        
        <p style="font-size: 16px; color: #6B5E53; line-height: 1.8; margin-bottom: 30px;">
            {!! nl2br(e($messageText)) !!}
        </p>

        <div class="button-wrapper">
            <a href="{{ $rsvpUrl }}" class="button">View Invitation & RSVP</a>
        </div>
        
        <p style="font-size: 14px; color: #8C8279; margin-top: 40px; font-style: italic;">
            Please respond by May 15th, 2025.
        </p>
    </div>
@endsection
