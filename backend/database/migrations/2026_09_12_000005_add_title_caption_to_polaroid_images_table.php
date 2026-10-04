<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $addedTakenAt = false;

        Schema::table('polaroid_images', function (Blueprint $table) use (&$addedTakenAt) {
            if (!Schema::hasColumn('polaroid_images', 'title')) {
                $table->string('title')->nullable()->after('image_path');
            }
            if (!Schema::hasColumn('polaroid_images', 'caption')) {
                $table->string('caption')->nullable()->after('title');
            }
            if (!Schema::hasColumn('polaroid_images', 'location')) {
                $table->string('location')->nullable()->after('caption');
            }
            if (!Schema::hasColumn('polaroid_images', 'taken_at')) {
                $table->timestamp('taken_at')->nullable()->after('location');
                $addedTakenAt = true;
            }
        });

        // The gallery orders polaroids by taken_at; backfill existing rows from
        // created_at so pre-existing images keep a sensible order instead of
        // sorting as NULL. Only runs when this migration just added the column.
        if ($addedTakenAt) {
            DB::table('polaroid_images')
                ->whereNull('taken_at')
                ->update(['taken_at' => DB::raw('created_at')]);
        }
    }

    public function down(): void
    {
        Schema::table('polaroid_images', function (Blueprint $table) {
            $table->dropColumn(['title', 'caption', 'location', 'taken_at']);
        });
    }
};
