<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Check flight statuses every 30 minutes
Schedule::command('flights:check-status')->everyThirtyMinutes();

// Nightly database backup (keeps the last 14); needs the cPanel cron for schedule:run
Schedule::command('backups:create --label=scheduled --keep=14')->dailyAt('02:15');
