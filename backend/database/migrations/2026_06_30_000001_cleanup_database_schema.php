<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add performance indexes on frequently queried columns
        Schema::table('guests', function (Blueprint $table) {
            $table->index('rsvp_status');
            $table->index('group');
            $table->index('checked_in_at');
        });

        Schema::table('invitations', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('enquiries', function (Blueprint $table) {
            $table->index('status');
        });

        // 2. Add unique constraint on invitations.guest_id (enforce 1:1 relationship)
        // Safety: ensure no duplicates exist before adding unique constraint
        $duplicates = DB::table('invitations')
            ->select('guest_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('guest_id')
            ->having('cnt', '>', 1)
            ->get();

        if ($duplicates->isNotEmpty()) {
            // Keep only the most recent invitation per guest_id, delete older duplicates
            foreach ($duplicates as $dup) {
                $keepId = DB::table('invitations')
                    ->where('guest_id', $dup->guest_id)
                    ->orderBy('updated_at', 'desc')
                    ->value('id');

                DB::table('invitations')
                    ->where('guest_id', $dup->guest_id)
                    ->where('id', '!=', $keepId)
                    ->delete();
            }
        }

        Schema::table('invitations', function (Blueprint $table) {
            $table->unique('guest_id');
        });

        // 3. Add soft deletes to critical tables for data safety
        Schema::table('guests', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('invitations', function (Blueprint $table) {
            $table->softDeletes();
        });

        // 4. Drop unused Spatie Permission tables (RBAC not implemented)
        Schema::dropIfExists('role_has_permissions');
        Schema::dropIfExists('model_has_roles');
        Schema::dropIfExists('model_has_permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('permissions');
    }

    public function down(): void
    {
        // Re-create Spatie Permission tables (restore from package migration if needed)
        // Note: This is destructive - the original migration from Spatie should be re-run
        // Schema::create('permissions', function (Blueprint $table) { ... });
        // Schema::create('roles', function (Blueprint $table) { ... });
        // Schema::create('model_has_permissions', function (Blueprint $table) { ... });
        // Schema::create('model_has_roles', function (Blueprint $table) { ... });
        // Schema::create('role_has_permissions', function (Blueprint $table) { ... });

        Schema::table('invitations', function (Blueprint $table) {
            $table->dropForeign(['guest_id']);
            $table->dropUnique(['guest_id']);
            $table->dropSoftDeletes();
        });

        Schema::table('guests', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropIndex(['rsvp_status']);
            $table->dropIndex(['group']);
            $table->dropIndex(['checked_in_at']);
        });

        Schema::table('invitations', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('enquiries', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });
    }
};
