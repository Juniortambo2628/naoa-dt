@extends('emails.layout')

@section('title', $subject ?? 'Thank You')

@section('content')
    <div style="text-align: center;">
        <h2 style="font-size: 24px; color: #4A3F35; margin-bottom: 20px;">Dear {{ $name }},</h2>
        
        <div style="font-size: 48px; margin-bottom: 20px;">🎁</div>

        <p style="font-size: 16px; color: #6B5E53; line-height: 1.8; margin-bottom: 30px;">
            {!! nl2br(e($messageText)) !!}
        </p>

        <div style="background-color: #FAF8F6; padding: 30px; border-radius: 15px; border: 1px solid #F0ECE9; margin-bottom: 40px; text-align: left;">
            <h3 style="font-size: 18px; color: #A67B5B; margin-bottom: 15px; text-align: center;">Gift Details</h3>
            <div style="margin-bottom: 10px;"><strong>Gift:</strong> {{ $giftName }}</div>
            @if($amount)
                <div style="margin-bottom: 0;"><strong>Amount:</strong> {{ number_format($amount, 2) }}</div>
            @endif
        </div>

        <div class="button-wrapper">
            <a href="{{ config('app.frontend_url') }}" class="button">Visit Our Wedding Site</a>
        </div>
    </div>
@endsection
