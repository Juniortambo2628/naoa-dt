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
            $table->string('location')->nullable()->after('rotation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('polaroid_images', function (Blueprint $table) {
            $table->dropColumn('location');
        });
    }
};
