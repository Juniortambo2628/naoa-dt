<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guest_travel_details', function (Blueprint $table) {
            $table->json('flight_status_snapshot')->nullable()->after('local_phone_carrier');
            $table->timestamp('last_flight_check_at')->nullable()->after('flight_status_snapshot');
        });
    }

    public function down(): void
    {
        Schema::table('guest_travel_details', function (Blueprint $table) {
            $table->dropColumn(['flight_status_snapshot', 'last_flight_check_at']);
        });
    }
};
