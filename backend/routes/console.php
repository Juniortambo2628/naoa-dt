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

// Queued jobs (e.g. schedule-change notifications) are drained by a
// long-running worker, not by the scheduler: the VPS runs a PM2
// `<app>-queue` process (deploy-kit), and shared hosting runs the sync
// driver where nothing is ever queued. A scheduled `queue:work` there
// would also die every minute — Hestia's CLI php.ini disables pcntl_*,
// which the queue worker needs to register its signal handlers.

// Version history older than Revision::KEEP_DAYS is pruned nightly.
Schedule::command('model:prune', ['--model' => [\App\Models\Revision::class]])->dailyAt('03:30');
