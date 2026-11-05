<?php

namespace Tests\Feature;

use Illuminate\Console\Scheduling\Schedule;
use Tests\TestCase;

/** The deploy installs one cron entry (`schedule:run`); these are what it runs. */
class SchedulerTest extends TestCase
{
    private function scheduled(): array
    {
        return collect(app(Schedule::class)->events())
            ->mapWithKeys(fn ($event) => [trim(preg_replace('/^.*artisan[\'"]?\s+/', '', $event->command)) => $event->expression])
            ->all();
    }

    public function test_nightly_backup_weekly_verify_and_flight_checks_are_scheduled(): void
    {
        $events = $this->scheduled();

        $this->assertSame('15 2 * * *', $events['backups:create --label=scheduled --keep=14 --offsite'] ?? null);
        $this->assertSame('0 3 * * 0', $events['backups:verify'] ?? null);
        $this->assertSame('*/30 * * * *', $events['flights:check-status'] ?? null);

        // No per-minute queue drain: the queue is drained by a long-running
        // worker (PM2 on the VPS, sync driver on shared hosting). A scheduled
        // drain fails there — Hestia's CLI php.ini disables pcntl_*.
        $this->assertArrayNotHasKey('queue:work --stop-when-empty --max-time=50 --tries=3', $events);
    }
}
