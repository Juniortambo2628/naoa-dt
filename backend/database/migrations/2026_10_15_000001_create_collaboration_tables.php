<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Collaboration support for the admin dashboard:
 *   - revisions: version history of admin-managed records (restore any version)
 *   - admin_module_visits: when each admin last opened each module (sidebar "new" badges)
 *   - users: presence (which page a collaborator is on) and invitation state
 */
return new class extends Migration
{
    public function up(): void
    {
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
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->uuid('batch')->nullable()->index();
            $table->timestamps();

            $table->index(['subject_type', 'subject_id']);
            $table->index(['module', 'created_at']);
        });

        Schema::create('admin_module_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('module', 40);
            $table->timestamp('seen_at');
            $table->unique(['user_id', 'module']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('last_active_at')->nullable();
            $table->string('current_module', 40)->nullable();
            $table->string('current_path')->nullable();
            $table->foreignId('invited_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('invite_accepted_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('invited_by');
            $table->dropColumn(['last_active_at', 'current_module', 'current_path', 'invite_accepted_at']);
        });
        Schema::dropIfExists('admin_module_visits');
        Schema::dropIfExists('revisions');
    }
};
