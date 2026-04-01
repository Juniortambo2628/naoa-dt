<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_item_id')->nullable()->constrained()->onDelete('cascade');
            $table->text('message');
            $table->enum('type', ['normal', 'important', 'alert'])->default('normal');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_updates');
    }
};
