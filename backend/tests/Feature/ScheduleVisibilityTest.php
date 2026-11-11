<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\LiveUpdate;
use App\Models\ScheduleItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Programme items hidden from guests stay in the admin only. */
class ScheduleVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private Event $event;

    private ScheduleItem $hidden;

    protected function setUp(): void
    {
        parent::setUp();
        $this->event = Event::factory()->create();
        ScheduleItem::factory()->create(['event_id' => $this->event->id, 'title' => 'Guest arrival']);
        $this->hidden = ScheduleItem::factory()->create([
            'event_id' => $this->event->id, 'title' => 'Bridal preparations', 'is_public' => false,
        ]);
    }

    private function titles($response): array
    {
        return collect($response->json('data'))->flatMap(fn ($e) => collect($e['schedule_items'] ?? [$e])->pluck('title'))->all();
    }

    public function test_guests_never_see_hidden_items(): void
    {
        $full = $this->getJson('/api/schedule/full')->assertOk();
        $this->assertSame(['Guest arrival'], $this->titles($full));

        $list = $this->getJson('/api/schedule')->assertOk();
        $this->assertSame(['Guest arrival'], collect($list->json('data'))->pluck('title')->all());
    }

    public function test_admin_sees_every_item_with_its_visibility(): void
    {
        $response = $this->actingAs(User::factory()->create(), 'sanctum')->getJson('/api/schedule/events')->assertOk();
        $items = collect($response->json('data.0.schedule_items'))->keyBy('title');

        $this->assertTrue($items['Guest arrival']['is_public']);
        $this->assertFalse($items['Bridal preparations']['is_public']);
    }

    public function test_admin_can_show_or_hide_an_item(): void
    {
        $admin = User::factory()->create();
        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/schedule/items/{$this->hidden->id}", ['is_public' => true])
            ->assertOk()
            ->assertJsonPath('data.is_public', true);

        $this->assertContains('Bridal preparations', $this->titles($this->getJson('/api/schedule/full')));

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/schedule/events/{$this->event->id}/items", [
                'title' => 'Crew briefing', 'start_time' => '07:00', 'is_public' => false,
            ])
            ->assertCreated();
        $this->assertNotContains('Crew briefing', $this->titles($this->getJson('/api/schedule/full')));
    }

    public function test_live_updates_do_not_reveal_a_hidden_item(): void
    {
        LiveUpdate::create(['schedule_item_id' => $this->hidden->id, 'message' => 'Running a little late', 'type' => 'normal']);

        $this->getJson('/api/schedule/updates')
            ->assertOk()
            ->assertJsonPath('data.0.message', 'Running a little late')
            ->assertJsonPath('data.0.schedule_item', null);
    }
}
