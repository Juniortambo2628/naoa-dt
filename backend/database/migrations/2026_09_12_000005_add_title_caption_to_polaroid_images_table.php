<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('polaroid_images', function (Blueprint $table) {
            $table->string('title')->nullable()->after('image_path');
            $table->string('caption')->nullable()->after('title');
            $table->string('location')->nullable()->after('caption');
            $table->timestamp('taken_at')->nullable()->after('location');
        });
    }

    public function down(): void
    {
        Schema::table('polaroid_images', function (Blueprint $table) {
            $table->dropColumn(['title', 'caption', 'location', 'taken_at']);
        });
    }
};
