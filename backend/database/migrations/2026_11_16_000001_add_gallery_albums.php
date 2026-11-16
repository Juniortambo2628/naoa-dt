<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Gallery albums, so the wedding photos read in the order things happened
 * (the Ayie on Thursday, then the wedding on Saturday), plus what the bulk
 * import needs: a small thumbnail, when each photo was taken, its file name
 * (so a re-run skips photos already in), its size, and a "featured" flag for
 * the home page slideshow.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gallery_albums', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->date('event_date')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        Schema::table('gallery_items', function (Blueprint $table) {
            $table->unsignedBigInteger('gallery_album_id')->nullable()->index();
            $table->string('thumb_url')->nullable();
            $table->timestamp('taken_at')->nullable();
            $table->string('original_name')->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->boolean('is_featured')->default(false);
        });

        if (DB::table('gallery_albums')->count() === 0) {
            $now = now();
            DB::table('gallery_albums')->insert([
                ['title' => 'Ayie', 'subtitle' => 'Thursday, 12 November 2026', 'event_date' => '2026-11-12', 'order' => 1, 'created_at' => $now, 'updated_at' => $now],
                ['title' => 'The Wedding', 'subtitle' => 'Saturday, 14 November 2026', 'event_date' => '2026-11-14', 'order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('gallery_items', function (Blueprint $table) {
            $table->dropIndex(['gallery_album_id']);
            $table->dropColumn(['gallery_album_id', 'thumb_url', 'taken_at', 'original_name', 'width', 'height', 'is_featured']);
        });
        Schema::dropIfExists('gallery_albums');
    }
};
