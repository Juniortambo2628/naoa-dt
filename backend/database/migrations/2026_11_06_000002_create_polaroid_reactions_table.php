<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Reactions to a story post (Snapchat-style emoji tap).
 *
 * One row per guest/device per polaroid: the unique pair keeps a double tap
 * from creating two rows, and the app updates the emoji in place when a
 * guest changes their mind. `guest_code` is nullable so a reaction from an
 * unnamed web visitor still works (the app then scopes by name).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('polaroid_reactions')) {
            Schema::create('polaroid_reactions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('polaroid_image_id')->index();
                $table->string('emoji', 16);
                $table->string('guest_name', 100)->nullable();
                $table->string('guest_code', 64)->nullable();
                $table->timestamps();

                $table->unique(['polaroid_image_id', 'guest_code']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('polaroid_reactions');
    }
};
