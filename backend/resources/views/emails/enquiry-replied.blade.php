@extends('emails.layout')

@section('title', 'Reply to your Enquiry')

@section('content')
<div style="text-align: left; padding: 20px; background: #fff; border-radius: 12px; border: 1px solid #f0ece9;">
    <h2 style="color: #A67B5B; margin-top: 0;">Hello {{ $enquiry->name }},</h2>
    <p>Thank you for reaching out regarding our wedding. We've received your enquiry and here is our response:</p>
    
    <div style="margin: 20px 0; padding: 15px; background: #faf8f6; border-radius: 8px; border-left: 4px solid #A67B5B;">
        <p style="white-space: pre-wrap; color: #4A3F35;">{{ $replyMessage }}</p>
    </div>

    <hr style="border: 0; border-top: 1px solid #f0ece9; margin: 25px 0;">
    
    <p style="font-size: 13px; color: #8C8279;">In response to your message:</p>
    <p style="font-size: 13px; color: #8C8279; font-style: italic;">"{{ $enquiry->message }}"</p>

    <p style="margin-top: 30px;">Warmly,<br><strong>Dinah & Tze Ren</strong></p>
</div>
@endsection
