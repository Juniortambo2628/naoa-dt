<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add new columns to guests table
        Schema::table('guests', function (Blueprint $table) {
            $table->text('rsvp_message')->nullable()->after('rsvp_status');
            $table->text('dietary_notes')->nullable()->after('rsvp_message');
        });

        // 2. Migrate existing data from rsvp_responses to guests
        if (Schema::hasTable('rsvp_responses')) {
            $responses = DB::table('rsvp_responses')->get();
            foreach ($responses as $response) {
                DB::table('guests')
                    ->where('id', $response->guest_id)
                    ->update([
                        'rsvp_message' => $response->message,
                        'dietary_notes' => $response->dietary_notes,
                        // Ensure rsvp_status matches attending boolean if it wasn't already set
                        'rsvp_status' => $response->attending ? 'confirmed' : 'declined',
                    ]);
            }

            // 3. Drop rsvp_responses table
            Schema::dropIfExists('rsvp_responses');
        }

        // 4. Remove redundant count-based column
        Schema::table('guests', function (Blueprint $table) {
            if (Schema::hasColumn('guests', 'confirmed_plus_ones')) {
                $table->dropColumn('confirmed_plus_ones');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guests', function (Blueprint $table) {
            $table->integer('confirmed_plus_ones')->default(0)->after('rsvp_status');
            $table->dropColumn(['rsvp_message', 'dietary_notes']);
        });

        Schema::create('rsvp_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guest_id')->constrained()->onDelete('cascade');
            $table->boolean('attending')->default(false);
            $table->integer('plus_ones_count')->default(0);
            $table->text('dietary_notes')->nullable();
            $table->text('message')->nullable();
            $table->timestamps();
        });
    }
};
