<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\ScheduleItem;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** The programme loaded from the couple's planner (see the import migration). */
class WeddingProgrammeImportTest extends TestCase
{
    use RefreshDatabase;

    private object $migration;

    protected function setUp(): void
    {
        parent::setUp();
        $this->app->instance('programme-import.force', true);
        $this->migration = require database_path('migrations/2026_11_11_000002_import_wedding_programme.php');
        $this->migration->up();
    }

    public function test_programme_is_loaded_and_public(): void
    {
        $event = Event::with('scheduleItems')->sole();
        $this->assertSame('Zereneti Gardens', $event->venue);
        $this->assertSame('2026-11-14', $event->event_date->toDateString());
        $this->assertCount(19, $event->scheduleItems);
        $this->assertSame('Bridal preparations', $event->scheduleItems->first()->title);
        $this->assertSame('Evening dinner', $event->scheduleItems->last()->title);

        $this->getJson('/api/schedule/full')->assertOk()->assertJsonPath('data.0.name', 'Traditional Wedding Celebration');

        $this->getJson('/api/public/settings')
            ->assertOk()
            ->assertJsonPath('data.bridal_party', "Anita\nEdna\nPhyllis\nOyemi\nAnkita\nNamz\nDiane\nNia\nImelda\nNanette")
            ->assertJsonPath('data.venue_name', 'Zereneti Gardens');
        $this->assertTrue((bool) DB::table('page_contents')->where('section_key', 'programme_page')->value('is_visible'));
    }

    public function test_import_runs_once_and_keeps_the_old_schedule(): void
    {
        // Simulate a schedule edited before the import, then run it again.
        Setting::where('key', 'programme_imported_v1')->delete();
        $item = ScheduleItem::first();
        $item->update(['title' => 'Edited by the couple']);

        $this->migration->up();

        $backup = json_decode(Setting::where('key', 'programme_backup_before_import')->value('value'), true);
        $this->assertSame('Edited by the couple', $backup[0]['items'][0]['title']);
        $this->assertSame(19, ScheduleItem::count());

        // With the marker present, later runs change nothing.
        ScheduleItem::first()->update(['title' => 'Kept']);
        $this->migration->up();
        $this->assertSame('Kept', ScheduleItem::first()->title);
    }

    public function test_updated_planner_wording_is_applied_without_overwriting_edits(): void
    {
        $sync = require database_path('migrations/2026_11_13_000002_sync_programme_with_updated_planner.php');
        $sync->up();

        $this->assertStringContainsString('in the boardroom as agreed', Setting::where('key', 'programme_note')->value('value'));
        $this->assertStringContainsString('will run alongside', Setting::where('key', 'programme_note')->value('value'));
        $this->assertStringEndsWith("runs concurrently with the couple's photo session.", ScheduleItem::where('title', 'Guest lunch')->value('description'));
        $this->assertSame(19, ScheduleItem::count());

        // A note the couple rewrote themselves is left alone.
        Setting::where('key', 'programme_note')->update(['value' => 'Our own note']);
        $sync->down();
        $sync->up();
        $this->assertSame('Our own note', Setting::where('key', 'programme_note')->value('value'));
    }
}
