<?php

namespace Tests\Feature;

use App\Models\GuestbookEntry;
use App\Models\User;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuestbookTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_public_can_list_approved_entries(): void
    {
        GuestbookEntry::factory()->approved()->count(3)->create();
        GuestbookEntry::factory()->pending()->count(2)->create();

        $response = $this->getJson('/api/guestbook');

        $response->assertOk()
            ->assertJsonStructure([
                'entries',
                'total',
            ]);

        $this->assertEquals(3, $response->json('total'));
    }

    public function test_public_can_submit_entry(): void
    {
        $response = $this->postJson('/api/guestbook', [
            'guest_name' => 'Happy Guest',
            'message' => 'Congratulations on your wedding!',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('guestbook_entries', [
            'guest_name' => 'Happy Guest',
            'message' => 'Congratulations on your wedding!',
            'is_approved' => true,
        ]);
    }

    public function test_admin_can_approve_entry(): void
    {
        $entry = GuestbookEntry::factory()->pending()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/guestbook-admin/{$entry->id}/approve");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Entry approved',
            ]);

        $this->assertDatabaseHas('guestbook_entries', [
            'id' => $entry->id,
            'is_approved' => true,
        ]);
    }

    public function test_admin_can_delete_entry(): void
    {
        $entry = GuestbookEntry::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/guestbook-admin/{$entry->id}");

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('guestbook_entries', ['id' => $entry->id]);
    }

    public function test_unauthenticated_user_cannot_approve_entry(): void
    {
        $entry = GuestbookEntry::factory()->pending()->create();

        $response = $this->patchJson("/api/guestbook-admin/{$entry->id}/approve");

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_delete_entry(): void
    {
        $entry = GuestbookEntry::factory()->create();

        $response = $this->deleteJson("/api/guestbook-admin/{$entry->id}");

        $response->assertStatus(401);
    }

    public function test_submit_entry_requires_guest_name_and_message(): void
    {
        $response = $this->postJson('/api/guestbook', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['guest_name', 'message']);
    }

    public function test_pending_entries_not_visible_publicly(): void
    {
        GuestbookEntry::factory()->pending()->create(['guest_name' => 'Hidden Guest']);

        $response = $this->getJson('/api/guestbook');

        $response->assertOk();
        $this->assertEquals(0, $response->json('total'));
    }

    public function test_entries_are_ordered_by_newest_first(): void
    {
        $old = GuestbookEntry::factory()->approved()->create(['message' => 'Old entry']);
        \Illuminate\Support\Facades\DB::table('guestbook_entries')
            ->where('id', $old->id)
            ->update(['created_at' => now()->subDays(2)]);

        $new = GuestbookEntry::factory()->approved()->create(['message' => 'New entry']);

        $response = $this->getJson('/api/guestbook');

        $response->assertOk();
        $entries = $response->json('entries');
        $this->assertEquals('New entry', $entries[0]['message']);
    }
}
