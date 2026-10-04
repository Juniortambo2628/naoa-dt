<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run()
    {
        $settings = [
            // Canonical wedding details — these are the single source of truth,
            // edited on the admin Settings page (Wedding Details card) and read
            // everywhere via frontend/src/utils/weddingInfo.js.
            ['key' => 'wedding_date', 'value' => '2026-11-14', 'group' => 'general'],
            ['key' => 'bride_name', 'value' => 'Dinah', 'group' => 'general'],
            ['key' => 'groom_name', 'value' => 'Tze Ren', 'group' => 'general'],
            ['key' => 'rsvp_enabled', 'value' => 'true', 'group' => 'general'],
            ['key' => 'admin_email_notifications', 'value' => 'true', 'group' => 'notifications'],
            ['key' => 'admin_email', 'value' => 'admin@wedding.com', 'group' => 'notifications'],
            ['key' => 'venue_name', 'value' => 'Rosewood Manor', 'group' => 'general'],
            ['key' => 'venue_address', 'value' => 'Karen, Nairobi', 'group' => 'general'],
            ['key' => 'venue_lat', 'value' => '-1.2921', 'group' => 'general'],
            ['key' => 'venue_lng', 'value' => '36.8219', 'group' => 'general'],
            ['key' => 'public_url', 'value' => 'http://localhost/wed-dt/backend/public', 'group' => 'general'],

            // Email Template Settings
            ['key' => 'email_invitation_subject', 'value' => 'You are invited! Dinah & Tze Ren\'s Wedding', 'group' => 'emails'],
            ['key' => 'email_invitation_message', 'value' => 'We are delighted to invite you to celebrate our wedding day. It would mean the world to us to have you there as we begin our new life together.', 'group' => 'emails'],

            ['key' => 'email_rsvp_subject', 'value' => 'RSVP Confirmation - Dinah & Tze Ren\'s Wedding', 'group' => 'emails'],
            ['key' => 'email_rsvp_attending_message', 'value' => 'We\'re so excited you can make it! Thank you for confirming your attendance. We can\'t wait to share this special day with you!', 'group' => 'emails'],
            ['key' => 'email_rsvp_declined_message', 'value' => 'We\'ll miss you! Thank you for letting us know. We understand you won\'t be able to join us, and we hope to celebrate with you another time.', 'group' => 'emails'],

            ['key' => 'email_gift_subject', 'value' => 'Thank you for your gift! - Dinah & Tze Ren', 'group' => 'emails'],
            ['key' => 'email_gift_message', 'value' => 'Thank you so much for your thoughtful gift and for being a part of our special day. Your generosity and kindness mean so much to us as we start our journey together.', 'group' => 'emails'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
