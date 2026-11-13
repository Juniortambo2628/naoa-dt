<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Brings the programme in line with Wayfarer Events' updated programme
 * (13 November). The times and items are unchanged; only two pieces of
 * wording moved:
 * - the programme note ("as agreed", "will run alongside");
 * - the guest lunch ("runs concurrently with the couple's photo session").
 *
 * Each text is only replaced while it still reads exactly as the first import
 * wrote it, so anything the couple edited in Admin → Schedule is kept.
 * Items hidden from guests stay hidden.
 */
return new class extends Migration
{
    private const NOTE_BEFORE = 'Timings are indicative and will be coordinated by the Wayfarer Events team. '
        .'Dowry negotiations will take place in the boardroom. Guest lunch (1:00–2:15 PM) runs alongside the '
        ."couple's photo session (1:20–2:30 PM); the couple will be served separately.";

    private const NOTE_AFTER = 'Timings are indicative and will be coordinated by the Wayfarer Events team. '
        .'Dowry negotiations will take place in the boardroom as agreed. Guest lunch (1:00–2:15 PM) will run alongside the '
        ."couple's photo session (1:20–2:30 PM); the couple will be served separately.";

    private const LUNCH_BEFORE = "Lunch served by Persis Caterers, with table-number service. This runs alongside the couple's photo session.";

    private const LUNCH_AFTER = "Lunch served by Persis Caterers, with table-number service. This runs concurrently with the couple's photo session.";

    public function up(): void
    {
        DB::table('settings')->where('key', 'programme_note')->where('value', self::NOTE_BEFORE)
            ->update(['value' => self::NOTE_AFTER, 'updated_at' => now()]);

        DB::table('schedule_items')->where('title', 'Guest lunch')->where('description', self::LUNCH_BEFORE)
            ->update(['description' => self::LUNCH_AFTER, 'updated_at' => now()]);
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'programme_note')->where('value', self::NOTE_AFTER)
            ->update(['value' => self::NOTE_BEFORE, 'updated_at' => now()]);

        DB::table('schedule_items')->where('title', 'Guest lunch')->where('description', self::LUNCH_AFTER)
            ->update(['description' => self::LUNCH_BEFORE, 'updated_at' => now()]);
    }
};
