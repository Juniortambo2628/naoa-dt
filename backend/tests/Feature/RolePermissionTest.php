<?php

namespace Tests\Feature;

use App\Models\Faq;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class RolePermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_existing_accounts_become_owners_and_new_ones_editors(): void
    {
        $owner = User::factory()->create();
        $this->assertSame('owner', $owner->role);

        $id = $this->actingAs($owner, 'sanctum')->postJson('/api/users', [
            'name' => 'Planner', 'email' => 'p@example.com', 'password' => 'secret-pass',
        ])->assertCreated()->json('data.id');

        $this->assertSame('editor', User::find($id)->role);
    }

    public function test_viewer_can_read_but_not_write(): void
    {
        $viewer = User::factory()->viewer()->create();
        $faq = Faq::create(['question' => 'Q?', 'answer' => 'A', 'order' => 1]);

        $this->actingAs($viewer, 'sanctum')->getJson('/api/settings')->assertOk();
        $this->actingAs($viewer, 'sanctum')->getJson('/api/revisions')->assertOk();

        $this->actingAs($viewer, 'sanctum')
            ->postJson('/api/settings', ['settings' => ['bride_name' => 'X']])
            ->assertForbidden()->assertJson(['reason' => 'role']);
        $this->actingAs($viewer, 'sanctum')->deleteJson("/api/faqs/{$faq->id}")->assertForbidden();
        $this->assertDatabaseHas('faqs', ['id' => $faq->id]);
    }

    public function test_viewer_keeps_session_and_presence(): void
    {
        $viewer = User::factory()->viewer()->create();

        $this->actingAs($viewer, 'sanctum')->postJson('/api/collaboration/heartbeat', ['module' => 'guests'])->assertOk();
        $this->actingAs($viewer, 'sanctum')->postJson('/api/notifications/mark-read')->assertOk();
    }

    public function test_editor_edits_content_but_not_people_or_backups(): void
    {
        Mail::fake();
        $editor = User::factory()->editor()->create();

        $this->actingAs($editor, 'sanctum')
            ->postJson('/api/settings', ['settings' => ['bride_name' => 'Dinah']])->assertOk();
        $this->actingAs($editor, 'sanctum')->getJson('/api/users')->assertOk();

        $this->actingAs($editor, 'sanctum')
            ->postJson('/api/users', ['name' => 'X', 'email' => 'x@example.com', 'password' => 'secret-pass'])
            ->assertForbidden();
        $this->actingAs($editor, 'sanctum')
            ->postJson('/api/collaborators/invite', ['name' => 'X', 'email' => 'x@example.com'])
            ->assertForbidden();
        $this->actingAs($editor, 'sanctum')->getJson('/api/backups')->assertForbidden();
    }

    public function test_owner_invites_with_a_role_and_changes_roles(): void
    {
        Mail::fake();
        $owner = User::factory()->create();

        $id = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/collaborators/invite', ['name' => 'Aunt Mei', 'email' => 'mei@example.com', 'role' => 'viewer'])
            ->assertCreated()->json('data.id');
        $this->assertSame('viewer', User::find($id)->role);

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/collaborators/{$id}/role", ['role' => 'editor'])->assertOk();
        $this->assertSame('editor', User::find($id)->role);

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/collaborators/{$id}/role", ['role' => 'admin'])->assertUnprocessable();
    }

    public function test_the_last_owner_cannot_be_demoted_or_deleted(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->editor()->create();

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/collaborators/{$owner->id}/role", ['role' => 'editor'])
            ->assertUnprocessable();
        $this->actingAs($owner, 'sanctum')
            ->putJson("/api/users/{$owner->id}", ['name' => $owner->name, 'email' => $owner->email, 'role' => 'viewer'])
            ->assertUnprocessable();

        // With a second owner, demoting is fine.
        $other->forceFill(['role' => 'owner'])->save();
        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/collaborators/{$owner->id}/role", ['role' => 'editor'])
            ->assertOk();

        // ...and another owner can then remove them.
        $this->actingAs($other, 'sanctum')->deleteJson("/api/users/{$owner->id}")->assertOk();
    }

    public function test_login_returns_the_role(): void
    {
        User::factory()->viewer()->create(['email' => 'v@example.com']);

        $this->postJson('/api/login', ['email' => 'v@example.com', 'password' => 'password'])
            ->assertOk()->assertJsonPath('data.user.role', 'viewer');
    }
}
