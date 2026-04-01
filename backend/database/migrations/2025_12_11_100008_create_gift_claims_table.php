<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gift_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gift_id')->constrained()->onDelete('cascade');
            $table->foreignId('guest_id')->nullable()->constrained()->onDelete('set null');
            $table->string('claimer_name'); // In case guest is not in system
            $table->string('claimer_email')->nullable();
            $table->decimal('amount', 10, 2)->nullable(); // For cash funds
            $table->text('message')->nullable();
            $table->boolean('is_purchased')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gift_claims');
    }
};
