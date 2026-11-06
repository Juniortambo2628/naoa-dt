<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Polaroids become Stories: record who took the photo so the viewer can group
 * them into per-author stories and attribute reactions to a device.
 *
 * Both columns are nullable and stored as plain indexed strings (see the
 * push migration for why guest references are not foreign keys): admin and
 * Test Lab polaroids simply belong to "the couple".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('polaroid_images', function (Blueprint $table) {
            if (! Schema::hasColumn('polaroid_images', 'guest_name')) {
                $table->string('guest_name', 100)->nullable()->after('location');
            }

            if (! Schema::hasColumn('polaroid_images', 'guest_code')) {
                $table->string('guest_code', 64)->nullable()->after('guest_name')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('polaroid_images', function (Blueprint $table) {
            foreach (['guest_code', 'guest_name'] as $column) {
                if (Schema::hasColumn('polaroid_images', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
