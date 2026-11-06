<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Which device has watched which story photo, so the couple can see "seen by"
 * counts.
 *
 * One row per guest/device per photo (the unique pair keeps a replay from
 * inflating the count); like the other guest references this is a plain
 * indexed column rather than a foreign key.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('polaroid_views')) {
            Schema::create('polaroid_views', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('polaroid_image_id')->index();
                $table->string('guest_name', 100)->nullable();
                $table->string('guest_code', 64)->nullable();
                $table->timestamps();

                $table->unique(['polaroid_image_id', 'guest_code']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('polaroid_views');
    }
};
