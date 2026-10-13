<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuestMergeTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_duplicates_are_grouped_by_email_and_normalised_name(): void
    {
        $a = Guest::factory()->create(['name' => 'John Doe', 'email' => 'john@example.com']);
        $b = Guest::factory()->create(['name' => 'Mr. Doe, John', 'email' => null]);
        $c = Guest::factory()->create(['name' => 'Johnny', 'email' => 'JOHN@example.com ']);
        Guest::factory()->create(['name' => 'Jane Smith', 'email' => 'jane@example.com']);
        Guest::factory()->create(['name' => 'Jane (Plus One 1)', 'email' => null]);
        Guest::factory()->create(['name' => 'Jane (Plus One 1)', 'email' => null]);

        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/guests/duplicates');

        $response->assertOk()->assertJsonPath('data.duplicate_count', 2);
        $groups = $response->json('data.groups');
        $this->assertCount(1, $groups);
        $this->assertEqualsCanonicalizing([$a->id, $b->id, $c->id], array_column($groups[0]['guests'], 'id'));
        $this->assertEqualsCanonicalizing(['Same email', 'Same name'], $groups[0]['reasons']);
    }

    public function test_merge_combines_details_and_removes_duplicates(): void
    {
        $keep = Guest::factory()->create([
            'name' => 'John Doe', 'email' => null, 'phone' => null,
            'rsvp_status' => 'pending', 'plus_ones_allowed' => 0,
        ]);
        $dup = Guest::factory()->create([
            'name' => 'john doe', 'email' => 'john@example.com', 'phone' => '0712345678',
            'rsvp_status' => 'confirmed', 'dietary_notes' => 'Vegetarian', 'plus_ones_allowed' => 2,
        ]);
        $plusOne = Guest::factory()->create(['name' => 'Partner', 'email' => null, 'parent_guest_id' => $dup->id]);
        Invitation::create(['guest_id' => $keep->id, 'status' => 'pending', 'token' => 'a']);
        Invitation::create(['guest_id' => $dup->id, 'status' => 'sent', 'token' => 'b']);

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/guests/merge', [
            'keep_id' => $keep->id,
            'merge_ids' => [$dup->id],
        ]);

        $response->assertOk()->assertJsonPath('data.id', $keep->id);

        $keep->refresh();
        $this->assertSame('john@example.com', $keep->email);
        $this->assertSame('0712345678', $keep->phone);
        $this->assertSame('confirmed', $keep->rsvp_status);
        $this->assertSame('Vegetarian', $keep->dietary_notes);
        $this->assertSame(2, $keep->plus_ones_allowed);
        $this->assertSoftDeleted('guests', ['id' => $dup->id]);
        $this->assertSame($keep->id, $plusOne->fresh()->parent_guest_id);
        $this->assertSame('sent', $keep->invitation->status);
        $this->assertSame(1, Invitation::withTrashed()->where('guest_id', $keep->id)->count());
        $this->assertSame(1, Guest::where('rsvp_status', 'confirmed')->count());
    }

    public function test_merge_rejects_keeping_and_merging_the_same_guest(): void
    {
        $guest = Guest::factory()->create();

        $this->actingAs($this->admin, 'sanctum')->postJson('/api/guests/merge', [
            'keep_id' => $guest->id,
            'merge_ids' => [$guest->id],
        ])->assertStatus(422);

        $this->assertNotSoftDeleted('guests', ['id' => $guest->id]);
    }

    public function test_merge_requires_authentication(): void
    {
        $this->postJson('/api/guests/merge', ['keep_id' => 1, 'merge_ids' => [2]])->assertUnauthorized();
    }
}
