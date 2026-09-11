<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guests', function (Blueprint $table) {
            $table->string('location_zone')->nullable()->after('invitation_via');
            $table->decimal('location_lat', 10, 7)->nullable()->after('location_zone');
            $table->decimal('location_lng', 10, 7)->nullable()->after('location_lat');
            $table->timestamp('location_updated_at')->nullable()->after('location_lng');
        });
    }

    public function down(): void
    {
        Schema::table('guests', function (Blueprint $table) {
            $table->dropColumn([
                'location_zone',
                'location_lat',
                'location_lng',
                'location_updated_at',
            ]);
        });
    }
};
