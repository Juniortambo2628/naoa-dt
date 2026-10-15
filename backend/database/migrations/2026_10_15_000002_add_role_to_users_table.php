<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Collaborator roles: owner (everything, incl. people & backups), editor
 * (edits content) and viewer (read-only). Everyone who already had an
 * account set the site up, so they become owners.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Safe to re-run: only accounts that existed before roles become owners.
        if (! Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role', 20)->default('editor')->after('email');
            });

            DB::table('users')->update(['role' => 'owner']);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }
};
