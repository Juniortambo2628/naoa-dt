<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\ScheduleItem;
use App\Models\LiveUpdate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScheduleTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_public_can_get_schedule(): void
    {
        $event = Event::factory()->create();
        ScheduleItem::factory()->count(3)->create(['event_id' => $event->id]);

        $response = $this->getJson('/api/schedule/');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data',
            ]);
    }

    public function test_public_can_get_full_schedule(): void
    {
        Event::factory()->count(2)->create();

        $response = $this->getJson('/api/schedule/full');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data',
            ]);
    }

    public function test_public_can_get_live_updates(): void
    {
        $event = Event::factory()->create();
        $item = ScheduleItem::factory()->create(['event_id' => $event->id]);
        LiveUpdate::factory()->count(3)->create(['schedule_item_id' => $item->id]);

        $response = $this->getJson('/api/schedule/updates');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data',
            ]);
    }

    public function test_admin_can_create_event(): void
    {
        $eventData = [
            'name' => 'Wedding Ceremony',
            'event_date' => '2025-06-15',
            'event_time' => '14:00',
            'venue' => 'St. Mary Church',
            'description' => 'The main ceremony',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/schedule/events', $eventData);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => ['name' => 'Wedding Ceremony'],
            ]);

        $this->assertDatabaseHas('events', ['name' => 'Wedding Ceremony']);
    }

    public function test_admin_can_update_event(): void
    {
        $event = Event::factory()->create(['name' => 'Old Event']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/schedule/events/{$event->id}", [
                'name' => 'Updated Event',
                'venue' => 'New Venue',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => ['name' => 'Updated Event'],
            ]);

        $this->assertDatabaseHas('events', ['id' => $event->id, 'name' => 'Updated Event']);
    }

    public function test_admin_can_delete_event(): void
    {
        $event = Event::factory()->create();
        ScheduleItem::factory()->count(2)->create(['event_id' => $event->id]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/schedule/events/{$event->id}");

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('events', ['id' => $event->id]);
        $this->assertDatabaseCount('schedule_items', 0);
    }

    public function test_admin_can_add_schedule_item(): void
    {
        $event = Event::factory()->create();

        $itemData = [
            'title' => 'Ceremony',
            'start_time' => '14:00',
            'end_time' => '15:00',
            'description' => 'The wedding ceremony',
            'location' => 'Main Hall',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/schedule/events/{$event->id}/items", $itemData);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => ['title' => 'Ceremony'],
            ]);

        $this->assertDatabaseHas('schedule_items', [
            'event_id' => $event->id,
            'title' => 'Ceremony',
        ]);
    }

    public function test_admin_can_update_schedule_item(): void
    {
        $event = Event::factory()->create();
        $item = ScheduleItem::factory()->create(['event_id' => $event->id, 'title' => 'Old Title']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/schedule/items/{$item->id}", [
                'title' => 'New Title',
                'status' => 'current',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => ['title' => 'New Title'],
            ]);

        $this->assertDatabaseHas('schedule_items', ['id' => $item->id, 'title' => 'New Title']);
    }

    public function test_admin_can_delete_schedule_item(): void
    {
        $event = Event::factory()->create();
        $item = ScheduleItem::factory()->create(['event_id' => $event->id]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/schedule/items/{$item->id}");

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('schedule_items', ['id' => $item->id]);
    }

    public function test_admin_can_post_live_update(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/schedule/updates', [
                'message' => 'The ceremony is starting soon!',
                'type' => 'important',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => ['message' => 'The ceremony is starting soon!'],
            ]);

        $this->assertDatabaseHas('live_updates', [
            'message' => 'The ceremony is starting soon!',
            'type' => 'important',
        ]);
    }

    public function test_admin_can_post_live_update_with_schedule_item(): void
    {
        $event = Event::factory()->create();
        $item = ScheduleItem::factory()->create(['event_id' => $event->id]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/schedule/updates', [
                'schedule_item_id' => $item->id,
                'message' => 'Ceremony is running 10 minutes late',
                'type' => 'normal',
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('live_updates', [
            'schedule_item_id' => $item->id,
            'message' => 'Ceremony is running 10 minutes late',
        ]);
    }

    public function test_unauthenticated_user_cannot_create_event(): void
    {
        $response = $this->postJson('/api/schedule/events', [
            'name' => 'Test',
            'event_date' => '2025-06-15',
            'event_time' => '14:00',
            'venue' => 'Test Venue',
        ]);

        $response->assertStatus(401);
    }

    public function test_create_event_requires_fields(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/schedule/events', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'event_date', 'event_time', 'venue']);
    }

    public function test_create_schedule_item_requires_title_and_start_time(): void
    {
        $event = Event::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/schedule/events/{$event->id}/items", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'start_time']);
    }
}
