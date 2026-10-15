@extends('emails.layout')

@section('title', 'You are invited to collaborate')

@section('content')
<div style="text-align: left; padding: 20px; background: #fff; border-radius: 12px; border: 1px solid #f0ece9;">
    <h2 style="color: #A67B5B; margin-top: 0;">Hello {{ $invitee->name }},</h2>
    <p><strong>{{ $inviter->name }}</strong> has invited you to help plan {{ \App\Support\WeddingInfo::coupleNames() }}'s wedding on the admin dashboard.</p>

    @if ($personalMessage)
    <div style="margin: 20px 0; padding: 15px; background: #faf8f6; border-radius: 8px; border-left: 4px solid #A67B5B;">
        <p style="white-space: pre-wrap; color: #4A3F35; margin: 0;">{{ $personalMessage }}</p>
    </div>
    @endif

    <p style="text-align: center; margin: 30px 0;">
        <a href="{{ $link }}" style="background: #A67B5B; color: #fff; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: bold;">Accept invitation</a>
    </p>

    <p style="font-size: 13px; color: #8C8279;">The link is valid for {{ \App\Http\Controllers\Api\CollaborationController::INVITE_DAYS }} days. You'll choose your own password when you open it.</p>
</div>
@endsection
