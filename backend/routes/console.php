<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Check flight statuses every 30 minutes
Schedule::command('flights:check-status')->everyThirtyMinutes();

// Nightly database backup (keeps the last 14); needs the cPanel cron for schedule:run.
// --offsite also copies it to BACKUP_OFFSITE_DISK / BACKUP_OFFSITE_EMAIL (config/backups.php).
Schedule::command('backups:create --label=scheduled --keep=14 --offsite')->dailyAt('02:15');

// Weekly proof that the newest backup actually restores (into a throwaway
// in-memory database; the real database is never touched).
Schedule::command('backups:verify')->weeklyOn(0, '03:00')->withoutOverlapping();

// Shared hosting has no long-running queue worker, so the scheduler drains
// queued jobs (e.g. schedule-change notifications) once a minute.
Schedule::command('queue:work --stop-when-empty --max-time=50 --tries=3')
    ->everyMinute()
    ->withoutOverlapping()
    ->when(fn () => config('queue.default') !== 'sync');
