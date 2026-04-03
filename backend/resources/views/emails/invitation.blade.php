@extends('emails.layout')

@section('title', $subject ?? 'Wedding Invitation')

@section('content')
    <div style="text-align: center;">
        <h2 style="font-size: 24px; color: #4A3F35; margin-bottom: 20px;">Dear {{ $guest->name }},</h2>
        
        <p style="font-size: 16px; color: #6B5E53; line-height: 1.8; margin-bottom: 20px;">
            {!! nl2br(e($messageText)) !!}
        </p>

        <div style="background-color: #F8F5F2; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px dashed #A67B5B;">
            <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #8C8279;">Your Personal RSVP Code</p>
            <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #A67B5B; letter-spacing: 4px;">{{ $rsvpCode }}</p>
        </div>

        <div class="button-wrapper">
            <a href="{{ $rsvpUrl }}" class="button">View Formal Invitation & RSVP</a>
        </div>

        <p style="font-size: 13px; color: #8C8279; margin-top: 20px;">
            <span style="vertical-align: middle;">📎</span> A personalized invitation card is attached to this email.
        </p>
        
        <p style="font-size: 14px; color: #8C8279; margin-top: 40px; font-style: italic;">
            Please respond by May 15th, 2025.
        </p>
    </div>
@endsection
