<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Programme items can be hidden from guests (Admin → Schedule, eye toggle):
 * the couple's own preparations stay in the run-of-show without appearing
 * on the Programme page or the invite's live widget.
 */
return new class extends Migration
{
    /** Imported programme items that are for the couple and crew, not guests. */
    private const BEHIND_THE_SCENES = ['Bridal preparations', 'Photography & content creation'];

    public function up(): void
    {
        if (! Schema::hasColumn('schedule_items', 'is_public')) {
            Schema::table('schedule_items', function (Blueprint $table) {
                $table->boolean('is_public')->default(true)->after('status');
            });

            DB::table('schedule_items')->whereIn('title', self::BEHIND_THE_SCENES)->update(['is_public' => false]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('schedule_items', 'is_public')) {
            Schema::table('schedule_items', function (Blueprint $table) {
                $table->dropColumn('is_public');
            });
        }
    }
};
