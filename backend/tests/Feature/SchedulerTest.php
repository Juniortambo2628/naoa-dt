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

    public function test_nightly_backup_weekly_verify_flight_checks_and_queue_drain_are_scheduled(): void
    {
        $events = $this->scheduled();

        $this->assertSame('15 2 * * *', $events['backups:create --label=scheduled --keep=14 --offsite'] ?? null);
        $this->assertSame('0 3 * * 0', $events['backups:verify'] ?? null);
        $this->assertSame('*/30 * * * *', $events['flights:check-status'] ?? null);
        $this->assertSame('* * * * *', $events['queue:work --stop-when-empty --max-time=50 --tries=3'] ?? null);
    }
}
