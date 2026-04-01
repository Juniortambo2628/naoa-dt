<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\PageContent;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        PageContent::firstOrCreate(
            ['section_key' => 'rsvp'],
            [
                'content' => [
                    'title' => 'RSVP',
                    'description' => 'We can\'t wait to celebrate with you!',
                    'page_title' => 'RSVP',
                    'page_subtitle' => 'We can\'t wait to celebrate with you!',
                ],
                'is_visible' => true
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No down needed as we don't want to delete content
    }
};
