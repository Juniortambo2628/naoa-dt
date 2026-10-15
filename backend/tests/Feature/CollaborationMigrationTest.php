<?php

namespace Tests\Feature;

use App\Models\Revision;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CollaborationMigrationTest extends TestCase
{
    use RefreshDatabase;

    private function migration(string $file): object
    {
        return require database_path("migrations/{$file}");
    }

    /**
     * Production state after the first deploy failed: MySQL had created the
     * `revisions` table (no indexes) and stopped at the foreign key, leaving
     * the rest undone. Running the migrations again must finish the job.
     */
    public function test_migrations_finish_a_half_applied_earlier_run(): void
    {
        $collaboration = $this->migration('2026_10_15_000001_create_collaboration_tables.php');
        $roles = $this->migration('2026_10_15_000002_add_role_to_users_table.php');
        $roles->down();
        $collaboration->down();

        Schema::create('revisions', function (Blueprint $table) {
            $table->id();
            $table->string('module', 40);
            $table->string('subject_type');
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('subject_label')->nullable();
            $table->string('action', 20);
            $table->longText('before')->nullable();
            $table->longText('after')->nullable();
            $table->json('changed')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->uuid('batch')->nullable();
            $table->timestamps();
        });

        $collaboration->up();
        $roles->up();

        $this->assertTrue(Schema::hasTable('admin_module_visits'));
        $this->assertTrue(Schema::hasColumns('users', ['last_active_at', 'current_module', 'current_path', 'invited_by', 'invite_accepted_at', 'role']));
        foreach ([['user_id'], ['batch'], ['subject_type', 'subject_id'], ['module', 'created_at']] as $index) {
            $this->assertTrue(Schema::hasIndex('revisions', $index), 'missing index on '.implode(',', $index));
        }

        // And once more: a completed run is a no-op.
        $collaboration->up();
        $roles->up();
        $this->assertTrue(Schema::hasTable('revisions'));
    }

    public function test_existing_accounts_stay_owners_when_the_role_migration_reruns(): void
    {
        $editor = User::factory()->editor()->create();

        $this->migration('2026_10_15_000002_add_role_to_users_table.php')->up();

        $this->assertSame('editor', $editor->fresh()->role);
    }

    public function test_deleting_a_user_cleans_up_what_references_them(): void
    {
        $owner = User::factory()->create();
        $leaving = User::factory()->editor()->create();
        $invitee = User::factory()->editor()->create(['invited_by' => $leaving->id]);

        $revision = Revision::create(['module' => 'faqs', 'subject_type' => 'x', 'action' => 'created', 'user_id' => $leaving->id]);
        DB::table('admin_module_visits')->insert(['user_id' => $leaving->id, 'module' => 'faqs', 'seen_at' => now()]);

        $this->actingAs($owner, 'sanctum')->deleteJson("/api/users/{$leaving->id}")->assertOk();

        $this->assertNull($revision->fresh()->user_id); // history keeps the change, by "someone"
        $this->assertDatabaseMissing('admin_module_visits', ['user_id' => $leaving->id]);
        $this->assertNull($invitee->fresh()->invited_by);
    }
}
