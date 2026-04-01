<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('polaroid_images', function (Blueprint $table) {
            $table->text('note')->nullable()->after('image_path');
            $table->string('custom_size')->nullable()->after('note');
            $table->string('offset_x')->nullable()->after('custom_size');
            $table->string('offset_y')->nullable()->after('offset_x');
            $table->integer('rotation')->nullable()->after('offset_y');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('polaroid_images', function (Blueprint $table) {
            $table->dropColumn(['note', 'custom_size', 'offset_x', 'offset_y', 'rotation']);
        });
    }
};
