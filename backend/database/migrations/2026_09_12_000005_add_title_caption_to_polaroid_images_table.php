<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('polaroid_images', function (Blueprint $table) {
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
            }
        });
    }

    public function down(): void
    {
        Schema::table('polaroid_images', function (Blueprint $table) {
            $table->dropColumn(['title', 'caption', 'location', 'taken_at']);
        });
    }
};
