<?php

namespace Tests\Feature;

use App\Mail\AdminRSVPNotification;
use App\Models\Guest;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class RsvpNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_notification_sent_to_configured_recipient_when_enabled(): void
    {
        Mail::fake();

        Setting::updateOrCreate(['key' => 'admin_email_notifications'], ['value' => 'true']);
        Setting::updateOrCreate(['key' => 'admin_email'], ['value' => 'invites-dntwed@okjtech.co.ke']);

        $guest = Guest::factory()->create([
            'unique_code' => 'NOTIFYES1',
            'plus_ones_allowed' => 2,
            'email' => 'guest@example.com',
        ]);

        // The guest form submits a Spotify pick as a "spotify:" prefixed JSON payload.
        $song = 'spotify:'.json_encode(['name' => 'Dancing Queen', 'artist' => 'ABBA']);

        $response = $this->postJson('/api/guests/code/NOTIFYES1/rsvp', [
            'attending' => true,
            'plus_ones_count' => 2,
            'message' => 'Cannot wait!',
            'song_request' => $song,
        ]);

        $response->assertOk()->assertJson(['success' => true]);

        Mail::assertSent(AdminRSVPNotification::class, function (AdminRSVPNotification $mail) {
            return $mail->hasTo('invites-dntwed@okjtech.co.ke')
                && $mail->attending === true
                && $mail->plusOnes === 2
                && $mail->guestMessage === 'Cannot wait!'
                && $mail->songRequest === 'Dancing Queen — ABBA';
        });
    }

    public function test_admin_notification_sent_when_setting_stored_as_legacy_boolean_string(): void
    {
        // A value saved as "1" (e.g. an older boolean save) must still enable
        // the notification — the strict "=== 'true'" check used to silently skip it.
        Mail::fake();

        Setting::updateOrCreate(['key' => 'admin_email_notifications'], ['value' => '1']);
        Setting::updateOrCreate(['key' => 'admin_email'], ['value' => 'host@example.com']);

        $guest = Guest::factory()->create(['unique_code' => 'NOTIFLEG1']);

        $this->postJson('/api/guests/code/NOTIFLEG1/rsvp', [
            'attending' => true,
        ])->assertOk();

        Mail::assertSent(AdminRSVPNotification::class);
    }

    public function test_admin_notification_sent_on_decline(): void
    {
        Mail::fake();

        Setting::updateOrCreate(['key' => 'admin_email_notifications'], ['value' => 'true']);
        Setting::updateOrCreate(['key' => 'admin_email'], ['value' => 'host@example.com']);

        $guest = Guest::factory()->create(['unique_code' => 'NOTIFNO1']);

        $this->postJson('/api/guests/code/NOTIFNO1/rsvp', [
            'attending' => false,
            'message' => 'Sorry!',
        ])->assertOk();

        Mail::assertSent(AdminRSVPNotification::class, function (AdminRSVPNotification $mail) {
            return $mail->hasTo('host@example.com') && $mail->attending === false;
        });
    }

    public function test_no_admin_notification_when_disabled(): void
    {
        Mail::fake();

        Setting::updateOrCreate(['key' => 'admin_email_notifications'], ['value' => 'false']);
        Setting::updateOrCreate(['key' => 'admin_email'], ['value' => 'host@example.com']);

        $guest = Guest::factory()->create(['unique_code' => 'NOTIFOFF1']);

        $this->postJson('/api/guests/code/NOTIFOFF1/rsvp', [
            'attending' => true,
        ])->assertOk();

        Mail::assertNotSent(AdminRSVPNotification::class);
    }

    public function test_admin_notification_falls_back_to_from_address_when_recipient_blank(): void
    {
        Mail::fake();
        config(['mail.from.address' => 'from@example.com']);

        Setting::updateOrCreate(['key' => 'admin_email_notifications'], ['value' => 'true']);
        Setting::updateOrCreate(['key' => 'admin_email'], ['value' => '']);

        $guest = Guest::factory()->create(['unique_code' => 'NOTIFBLNK']);

        $this->postJson('/api/guests/code/NOTIFBLNK/rsvp', [
            'attending' => true,
        ])->assertOk();

        Mail::assertSent(AdminRSVPNotification::class, function (AdminRSVPNotification $mail) {
            return $mail->hasTo('from@example.com');
        });
    }
}
