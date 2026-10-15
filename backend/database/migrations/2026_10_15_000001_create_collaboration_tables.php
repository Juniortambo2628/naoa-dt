<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Collaboration support for the admin dashboard:
 *   - revisions: version history of admin-managed records (restore any version)
 *   - admin_module_visits: when each admin last opened each module (sidebar "new" badges)
 *   - users: presence (which page a collaborator is on) and invitation state
 *
 * References to `users` are plain indexed columns, not database foreign keys:
 * on some hosts the `users` table can't be referenced (MySQL error 1824, e.g.
 * when it uses a different storage engine). User::deleting() does the cleanup
 * a cascade would have done.
 *
 * Every step checks what already exists, because MySQL can't roll back schema
 * changes: a run that failed half-way must be able to simply run again.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('revisions')) {
            Schema::create('revisions', function (Blueprint $table) {
                $table->id();
                $table->string('module', 40)->index();
                $table->string('subject_type');
                $table->unsignedBigInteger('subject_id')->nullable();
                $table->string('subject_label')->nullable();
                $table->string('action', 20); // created | updated | deleted | restored
                $table->longText('before')->nullable();
                $table->longText('after')->nullable();
                $table->json('changed')->nullable();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->uuid('batch')->nullable()->index();
                $table->timestamps();

                $table->index(['subject_type', 'subject_id']);
                $table->index(['module', 'created_at']);
            });
        }

        // A half-finished earlier run may have created the table without all
        // of its indexes (MySQL adds them in separate statements).
        $indexes = [['module'], ['user_id'], ['batch'], ['subject_type', 'subject_id'], ['module', 'created_at']];
        foreach ($indexes as $index) {
            if (! Schema::hasIndex('revisions', $index)) {
                Schema::table('revisions', fn (Blueprint $table) => $table->index($index));
            }
        }

        if (! Schema::hasTable('admin_module_visits')) {
            Schema::create('admin_module_visits', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->string('module', 40);
                $table->timestamp('seen_at');
                $table->unique(['user_id', 'module']);
            });
        }

        $columns = [
            'last_active_at' => fn (Blueprint $table) => $table->timestamp('last_active_at')->nullable(),
            'current_module' => fn (Blueprint $table) => $table->string('current_module', 40)->nullable(),
            'current_path' => fn (Blueprint $table) => $table->string('current_path')->nullable(),
            'invited_by' => fn (Blueprint $table) => $table->unsignedBigInteger('invited_by')->nullable()->index(),
            'invite_accepted_at' => fn (Blueprint $table) => $table->timestamp('invite_accepted_at')->nullable(),
        ];
        foreach ($columns as $name => $add) {
            if (! Schema::hasColumn('users', $name)) {
                Schema::table('users', fn (Blueprint $table) => $add($table));
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasIndex('users', ['invited_by'])) {
            Schema::table('users', fn (Blueprint $table) => $table->dropIndex(['invited_by']));
        }
        foreach (['last_active_at', 'current_module', 'current_path', 'invited_by', 'invite_accepted_at'] as $name) {
            if (Schema::hasColumn('users', $name)) {
                Schema::table('users', fn (Blueprint $table) => $table->dropColumn($name));
            }
        }
        Schema::dropIfExists('admin_module_visits');
        Schema::dropIfExists('revisions');
    }
};
