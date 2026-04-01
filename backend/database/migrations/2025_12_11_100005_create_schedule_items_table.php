<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->time('start_time');
            $table->time('end_time')->nullable();
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->string('type')->default('default'); // ceremony, cocktails, dinner, dancing, etc.
            $table->enum('status', ['upcoming', 'current', 'completed'])->default('upcoming');
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_items');
    }
};
