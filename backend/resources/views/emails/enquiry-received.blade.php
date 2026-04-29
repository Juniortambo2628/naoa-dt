@extends('emails.layout')

@section('title', 'Enquiry Received')

@section('content')
<div style="text-align: left; padding: 20px; background: #fff; border-radius: 12px; border: 1px solid #f0ece9;">
    <h2 style="color: #A67B5B; margin-top: 0;">Hello Dinah & Tze Ren,</h2>
    <p>You have received a new enquiry from your wedding website.</p>
    
    <div style="margin: 20px 0; padding: 15px; background: #faf8f6; border-radius: 8px;">
        <p style="margin: 5px 0;"><strong>From:</strong> {{ $enquiry->name }} ({{ $enquiry->email }})</p>
        <p style="margin: 5px 0;"><strong>Subject:</strong> {{ $enquiry->subject ?? 'No Subject' }}</p>
        <p style="margin: 15px 0;"><strong>Message:</strong></p>
        <p style="font-style: italic; color: #6b5d52;">"{{ $enquiry->message }}"</p>
    </div>

    <p>You can manage this enquiry and reply from your <a href="{{ config('app.frontend_url') }}/admin/dashboard/enquiries" style="color: #A67B5B; font-weight: bold; text-decoration: none;">Admin Dashboard</a>.</p>
</div>
@endsection
