<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guest_travel_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guest_id')->constrained()->onDelete('cascade');
            
            // Accommodation
            $table->string('hotel_name')->nullable();
            $table->text('hotel_address')->nullable();
            $table->date('hotel_check_in')->nullable();
            $table->date('hotel_check_out')->nullable();
            $table->string('hotel_confirmation')->nullable();
            $table->text('hotel_notes')->nullable();
            
            // Flight
            $table->string('airline')->nullable();
            $table->string('flight_number', 50)->nullable();
            $table->dateTime('flight_departure')->nullable();
            $table->dateTime('flight_arrival')->nullable();
            $table->string('flight_departure_airport', 10)->nullable();
            $table->string('flight_arrival_airport', 10)->nullable();
            $table->string('flight_confirmation')->nullable();
            $table->text('flight_notes')->nullable();
            
            // Digital tickets
            $table->string('ticket_file_path', 500)->nullable();
            $table->string('ticket_file_name')->nullable();
            $table->string('ticket_file_type', 50)->nullable();
            
            // Transport to venue
            $table->string('transport_method')->nullable();
            $table->text('transport_notes')->nullable();
            
            $table->timestamps();
            
            $table->index('guest_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guest_travel_details');
    }
};
