<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Widen settings.value from TEXT (MySQL hard cap ~64 KB) to LONGTEXT.
 *
 * The invitation / save-the-date designer autosaves the ENTIRE multi-page
 * design document (every page) as one JSON blob into this single setting row.
 * Multilingual (multibyte) content across multiple pages can exceed the 64 KB
 * TEXT limit; with MySQL strict mode the oversized save then throws and is
 * silently lost, so extra pages (e.g. page 2) never persist and vanish on
 * reload. LONGTEXT (up to 4 GB) removes that cap.
 *
 * Reversible: down() restores TEXT. Note that rolling back can truncate any
 * row already larger than 64 KB — expected for the reverse direction.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->longText('value')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->text('value')->nullable()->change();
        });
    }
};
