<?php

namespace Tests\Feature;

use App\Models\Table;
use App\Models\Guest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TableTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_admin_can_list_tables(): void
    {
        Table::factory()->count(3)->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/tables');

        $response->assertOk()
            ->assertJsonCount(3)
            ->assertJsonStructure([
                '*' => ['id', 'name', 'capacity', 'type', 'guests'],
            ]);
    }

    public function test_admin_can_create_table(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/tables', [
                'name' => 'Head Table',
                'capacity' => 10,
                'type' => 'round',
                'x' => 100,
                'y' => 200,
                'width' => 150,
                'height' => 150,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Head Table',
                    'capacity' => 10,
                    'type' => 'round',
                ],
            ]);

        $this->assertDatabaseHas('tables', ['name' => 'Head Table', 'capacity' => 10]);
    }

    public function test_admin_can_update_table(): void
    {
        $table = Table::factory()->create(['name' => 'Old Table']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/tables/{$table->id}", [
                'name' => 'New Table',
                'capacity' => 12,
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => ['name' => 'New Table'],
            ]);

        $this->assertDatabaseHas('tables', ['id' => $table->id, 'name' => 'New Table']);
    }

    public function test_admin_can_delete_table(): void
    {
        $table = Table::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/tables/{$table->id}");

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('tables', ['id' => $table->id]);
    }

    public function test_admin_can_assign_guest_to_table(): void
    {
        $table = Table::factory()->create();
        $guest = Guest::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/tables/{$table->id}/assign", [
                'guest_id' => $guest->id,
            ]);

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('guests', ['id' => $guest->id, 'table_id' => $table->id]);
    }

    public function test_admin_can_unassign_guest_from_table(): void
    {
        $table = Table::factory()->create();
        $guest = Guest::factory()->create(['table_id' => $table->id]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/tables/guests/{$guest->id}/unassign");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Guest unassigned',
            ]);

        $this->assertDatabaseHas('guests', ['id' => $guest->id, 'table_id' => null]);
    }

    public function test_unauthenticated_user_cannot_list_tables(): void
    {
        $response = $this->getJson('/api/tables');

        $response->assertStatus(401);
    }

    public function test_create_table_requires_name_capacity_and_type(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/tables', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'capacity', 'type']);
    }

    public function test_assign_requires_valid_guest_id(): void
    {
        $table = Table::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/tables/{$table->id}/assign", [
                'guest_id' => 99999,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['guest_id']);
    }

    public function test_table_includes_guests_when_listed(): void
    {
        $table = Table::factory()->create();
        Guest::factory()->count(2)->create(['table_id' => $table->id]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/tables');

        $response->assertOk();
        $tables = $response->json();
        $tableData = collect($tables)->firstWhere('id', $table->id);
        $this->assertCount(2, $tableData['guests']);
    }
}
