@extends('emails.layout')

@section('title', 'Website backup')

@section('content')
<div style="text-align: left; padding: 20px; background: #fff; border-radius: 12px; border: 1px solid #f0ece9;">
    <h2 style="color: #A67B5B; margin-top: 0;">New website backup</h2>
    <p>A scheduled backup of the {{ config('app.name') }} database was created.</p>

    <div style="margin: 20px 0; padding: 15px; background: #faf8f6; border-radius: 8px; border-left: 4px solid #A67B5B;">
        <p style="margin: 0;"><strong>File:</strong> {{ $backup['name'] }}</p>
        <p style="margin: 0;"><strong>Created:</strong> {{ $backup['created_at'] }}</p>
        <p style="margin: 0;"><strong>Size:</strong> {{ $sizeMb }} MB</p>
        <p style="margin: 0;"><strong>Contents:</strong> {{ $backup['tables'] }} tables, {{ $backup['rows'] }} records</p>
    </div>

    @if ($attached)
        <p>The backup is attached to this email. Keep it somewhere safe; it can be restored from the admin area (Backups) after uploading it to <code>storage/app/backups</code>.</p>
    @else
        <p><strong>The backup was not attached</strong> because it is larger than the {{ rtrim(rtrim(number_format($maxMegabytes, 2, '.', ''), '0'), '.') }} MB email limit (BACKUP_OFFSITE_EMAIL_MAX_MB). Download it from the admin area (Backups) or from the off-site disk instead.</p>
    @endif

    <p style="font-size: 13px; color: #8C8279; margin-top: 30px;">This message was sent automatically by the nightly backup job.</p>
</div>
@endsection
