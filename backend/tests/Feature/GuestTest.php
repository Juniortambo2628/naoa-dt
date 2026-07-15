<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\Invitation;
use App\Models\User;
use App\Models\Table;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuestTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_admin_can_list_guests(): void
    {
        Guest::factory()->count(3)->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/guests');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'email', 'rsvp_status'],
                ],
            ]);

        $this->assertCount(3, $response->json('data'));
    }

    public function test_admin_can_create_guest(): void
    {
        $guestData = [
            'name' => 'John Doe',
            'email' => 'john-doe-create@example.com',
            'phone' => '1234567890',
            'group' => 'family',
            'plus_ones_allowed' => 2,
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/guests', $guestData);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'John Doe',
                    'email' => 'john-doe-create@example.com',
                ],
            ]);

        $this->assertDatabaseHas('guests', [
            'name' => 'John Doe',
            'email' => 'john-doe-create@example.com',
            'rsvp_status' => 'pending',
        ]);

        $guest = Guest::where('email', 'john-doe-create@example.com')->first();
        $this->assertDatabaseHas('invitations', [
            'guest_id' => $guest->id,
            'status' => 'pending',
        ]);
    }

    public function test_admin_can_create_guest_with_plus_ones(): void
    {
        $guestData = [
            'name' => 'John PlusOne',
            'email' => 'john-plusone@example.com',
            'group' => 'friends',
            'plus_ones_allowed' => 2,
            'plus_ones_data' => [
                ['name' => 'Jane PlusOne', 'email' => 'jane-plusone@example.com'],
                ['name' => 'Baby PlusOne'],
            ],
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/guests', $guestData);

        $response->assertStatus(201);

        $this->assertDatabaseHas('guests', ['name' => 'John PlusOne', 'parent_guest_id' => null]);
        $this->assertDatabaseHas('guests', ['name' => 'Jane PlusOne']);
        $this->assertDatabaseHas('guests', ['name' => 'Baby PlusOne']);

        $parentGuest = Guest::where('email', 'john-plusone@example.com')->first();
        $this->assertCount(2, $parentGuest->plusOnes);
    }

    public function test_admin_can_update_guest(): void
    {
        $guest = Guest::factory()->create(['name' => 'Original Name']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/guests/{$guest->id}", [
                'name' => 'Updated Name',
                'email' => $guest->email,
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => ['name' => 'Updated Name'],
            ]);

        $this->assertDatabaseHas('guests', ['id' => $guest->id, 'name' => 'Updated Name']);
    }

    public function test_admin_can_delete_guest(): void
    {
        $guest = Guest::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/guests/{$guest->id}");

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertSoftDeleted('guests', ['id' => $guest->id]);
    }

    public function test_admin_can_get_statistics(): void
    {
        Guest::factory()->confirmed()->count(5)->create();
        Guest::factory()->declined()->count(2)->create();
        Guest::factory()->pending()->count(3)->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/guests/statistics');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total',
                    'attending',
                    'declined',
                    'pending',
                    'total_guests',
                    'recent',
                ],
            ]);

        $data = $response->json('data');
        $this->assertEquals(10, $data['total']);
        $this->assertEquals(5, $data['attending']);
        $this->assertEquals(2, $data['declined']);
        $this->assertEquals(3, $data['pending']);
    }

    public function test_guest_can_be_fetched_by_code(): void
    {
        $guest = Guest::factory()->create(['unique_code' => 'TESTCODE1']);

        $response = $this->getJson('/api/guests/code/TESTCODE1');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'unique_code' => 'TESTCODE1',
                    'name' => $guest->name,
                ],
            ]);
    }

    public function test_guest_rsvp_submission(): void
    {
        $guest = Guest::factory()->create([
            'unique_code' => 'RSVPTEST1',
            'plus_ones_allowed' => 1,
        ]);

        $response = $this->postJson("/api/guests/code/RSVPTEST1/rsvp", [
            'attending' => true,
            'plus_ones_count' => 1,
            'message' => 'Looking forward to it!',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ]);

        $guest->refresh();
        $this->assertEquals('confirmed', $guest->rsvp_status);
        $this->assertEquals('Looking forward to it!', $guest->rsvp_message);
    }

    public function test_guest_rsvp_decline(): void
    {
        $guest = Guest::factory()->create([
            'unique_code' => 'DECLTEST1',
        ]);

        $response = $this->postJson("/api/guests/code/DECLTEST1/rsvp", [
            'attending' => false,
            'message' => 'Sorry, cannot make it.',
        ]);

        $response->assertOk();

        $guest->refresh();
        $this->assertEquals('declined', $guest->rsvp_status);
    }

    public function test_admin_can_bulk_update_guests(): void
    {
        $guests = Guest::factory()->count(3)->create(['group' => 'friends']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/guests/bulk-update', [
                'ids' => $guests->pluck('id')->toArray(),
                'data' => ['group' => 'family'],
            ]);

        $response->assertOk()
            ->assertJson(['success' => true]);

        foreach ($guests as $guest) {
            $this->assertDatabaseHas('guests', ['id' => $guest->id, 'group' => 'family']);
        }
    }

    public function test_admin_can_reset_guest_rsvp(): void
    {
        $guest = Guest::factory()->confirmed()->create([
            'rsvp_message' => 'Attending!',
            'dietary_notes' => 'Vegetarian',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/guests/{$guest->id}/reset-rsvp");

        $response->assertOk()
            ->assertJson(['success' => true]);

        $guest->refresh();
        $this->assertEquals('pending', $guest->rsvp_status);
        $this->assertNull($guest->rsvp_message);
        $this->assertNull($guest->dietary_notes);
    }

    public function test_validation_requires_name(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/guests', [
                'email' => 'test@example.com',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_unauthenticated_user_cannot_list_guests(): void
    {
        Guest::factory()->count(3)->create();

        $response = $this->getJson('/api/guests');

        $response->assertStatus(401);
    }

    public function test_admin_can_filter_guests_by_group(): void
    {
        Guest::factory()->count(2)->create(['group' => 'family']);
        Guest::factory()->count(3)->create(['group' => 'friends']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/guests?group=family');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_admin_can_search_guests(): void
    {
        Guest::factory()->create(['name' => 'UniqueSearchJohn']);
        Guest::factory()->create(['name' => 'UniqueSearchJane']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/guests?search=UniqueSearchJohn');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('UniqueSearchJohn', $response->json('data.0.name'));
    }

    public function test_guest_not_found_by_code(): void
    {
        $response = $this->getJson('/api/guests/code/NONEXIST');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Guest not found',
            ]);
    }

    public function test_rsvp_submission_for_nonexistent_guest(): void
    {
        $response = $this->postJson('/api/guests/code/FAKECODE/rsvp', [
            'attending' => true,
        ]);

        $response->assertStatus(404);
    }
}
