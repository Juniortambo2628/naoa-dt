<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_guests_cannot_list_users(): void
    {
        $this->getJson('/api/users')->assertUnauthorized();
    }

    public function test_admin_can_create_update_and_delete_users(): void
    {
        $created = $this->actingAs($this->admin)->postJson('/api/users', [
            'name' => 'Planner',
            'email' => 'planner@example.com',
            'password' => 'secret-pass',
        ])->assertCreated()->assertJsonMissingPath('data.password');

        $id = $created->json('data.id');

        $this->actingAs($this->admin)->putJson("/api/users/{$id}", [
            'name' => 'Lead Planner',
            'email' => 'planner@example.com',
        ])->assertOk()->assertJsonFragment(['name' => 'Lead Planner']);

        $this->actingAs($this->admin)->getJson('/api/users')->assertOk()->assertJsonCount(2, 'data');

        $this->actingAs($this->admin)->deleteJson("/api/users/{$id}")->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $id]);
    }

    public function test_admin_cannot_delete_self(): void
    {
        User::factory()->create();

        $this->actingAs($this->admin)->deleteJson("/api/users/{$this->admin->id}")->assertStatus(422);
    }

    public function test_email_must_be_unique(): void
    {
        $this->actingAs($this->admin)->postJson('/api/users', [
            'name' => 'Dup',
            'email' => $this->admin->email,
            'password' => 'secret-pass',
        ])->assertStatus(422)->assertJsonValidationErrors(['email']);
    }
}
