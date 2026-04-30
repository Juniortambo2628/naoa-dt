@extends('emails.layout')

@section('content')
<div style="background-color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #f0f0f0;">
    <h2 style="color: #A67B5B; margin-bottom: 24px; font-family: 'Montserrat', sans-serif;">New RSVP Notification</h2>
    
    <p style="color: #444; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        Good news! A guest has just submitted their RSVP.
    </p>

    <div style="background-color: #fcfaf8; padding: 25px; border-radius: 12px; border-left: 4px solid #A67B5B; margin-bottom: 30px;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 10px 0; color: #777; width: 140px;"><strong>Guest Name:</strong></td>
                <td style="padding: 10px 0; color: #333; font-weight: 600;">{{ $guest->name }}</td>
            </tr>
            <tr>
                <td style="padding: 10px 0; color: #777;"><strong>RSVP Status:</strong></td>
                <td style="padding: 10px 0;">
                    @if($attending)
                        <span style="color: #2e7d32; font-weight: bold;">✅ Attending</span>
                    @else
                        <span style="color: #c62828; font-weight: bold;">❌ Declined</span>
                    @endif
                </td>
            </tr>
            <tr>
                <td style="padding: 10px 0; color: #777;"><strong>Group:</strong></td>
                <td style="padding: 10px 0; color: #333;">{{ $guest->group }}</td>
            </tr>
            @if($attending)
            <tr>
                <td style="padding: 10px 0; color: #777;"><strong>Plus Ones:</strong></td>
                <td style="padding: 10px 0; color: #333;">{{ $plusOnes }}</td>
            </tr>
            @endif
        </table>
    </div>

    @if($guestMessage)
    <div style="margin-bottom: 30px;">
        <h3 style="color: #8C6A4D; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Message from Guest:</h3>
        <div style="font-style: italic; color: #555; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #eee;">
            "{{ $guestMessage }}"
        </div>
    </div>
    @endif

    <div style="text-align: center; margin-top: 40px;">
        <a href="{{ config('app.url') }}/admin/guests" style="background-color: #A67B5B; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">View Guest List</a>
    </div>
</div>
@endsection
