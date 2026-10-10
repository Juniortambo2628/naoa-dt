<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_admin_can_get_settings(): void
    {
        Setting::create(['key' => 'test_wedding_date', 'value' => '2025-06-15']);
        Setting::create(['key' => 'test_couple_names', 'value' => 'John & Jane']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/settings');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'test_wedding_date' => '2025-06-15',
                    'test_couple_names' => 'John & Jane',
                ],
            ]);
    }

    public function test_admin_can_update_settings(): void
    {
        Setting::create(['key' => 'test_wedding_date', 'value' => '2025-06-15']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/settings', [
                'settings' => [
                    'test_wedding_date' => '2025-07-20',
                    'test_new_setting' => 'new_value',
                ],
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Settings updated successfully',
            ]);

        $this->assertDatabaseHas('settings', ['key' => 'test_wedding_date', 'value' => '2025-07-20']);
        $this->assertDatabaseHas('settings', ['key' => 'test_new_setting', 'value' => 'new_value']);
    }

    public function test_unauthenticated_user_cannot_get_settings(): void
    {
        $response = $this->getJson('/api/settings');

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_update_settings(): void
    {
        $response = $this->postJson('/api/settings', [
            'settings' => ['key' => 'value'],
        ]);

        $response->assertStatus(401);
    }

    public function test_update_settings_requires_settings_array(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/settings', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['settings']);
    }

    public function test_settings_returns_empty_when_none_exist(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/settings');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [],
            ]);
    }

    public function test_updating_existing_setting_overwrites_value(): void
    {
        Setting::create(['key' => 'test_theme', 'value' => 'light']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/settings', [
                'settings' => ['test_theme' => 'dark'],
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('settings', ['key' => 'test_theme', 'value' => 'dark']);
        $this->assertDatabaseCount('settings', 1);
    }

    public function test_public_settings_endpoint_is_unauthenticated(): void
    {
        Setting::create(['key' => 'wedding_date', 'value' => '2026-11-14']);

        $response = $this->getJson('/api/public/settings');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => ['wedding_date' => '2026-11-14'],
            ]);
    }

    public function test_public_settings_returns_whitelisted_keys_including_invitation_theme(): void
    {
        Setting::create(['key' => 'wedding_date', 'value' => '2026-11-14']);
        Setting::create(['key' => 'bride_name', 'value' => 'Dinah']);
        Setting::create(['key' => 'groom_name', 'value' => 'Tze Ren']);
        Setting::create(['key' => 'venue_name', 'value' => 'Zereniti House']);
        Setting::create(['key' => 'venue_address', 'value' => 'Limuru, Kenya']);
        Setting::create(['key' => 'venue_lat', 'value' => '-1.1']);
        Setting::create(['key' => 'venue_lng', 'value' => '36.6']);
        Setting::create(['key' => 'invitation_theme', 'value' => json_encode(['accentColor' => '#A67B5B'])]);

        $response = $this->getJson('/api/public/settings');

        $response->assertOk()
            ->assertJsonFragment(['wedding_date' => '2026-11-14'])
            ->assertJsonFragment(['venue_name' => 'Zereniti House']);

        // JSON-encoded design blob is decoded for the frontend.
        $this->assertSame('#A67B5B', $response->json('data.invitation_theme.accentColor'));
    }

    public function test_public_settings_includes_invitation_section_toggles(): void
    {
        $this->actingAs(\App\Models\User::factory()->create(), 'sanctum')
            ->postJson('/api/settings', ['settings' => ['invitation_sections' => ['map' => false, 'weather' => true]]])
            ->assertOk();

        $response = $this->getJson('/api/public/settings')->assertOk();

        $this->assertFalse($response->json('data.invitation_sections.map'));
        $this->assertTrue($response->json('data.invitation_sections.weather'));
    }

    public function test_public_settings_excludes_private_keys(): void
    {
        Setting::create(['key' => 'wedding_date', 'value' => '2026-11-14']);
        Setting::create(['key' => 'admin_email', 'value' => 'admin@wedding.com']);
        Setting::create(['key' => 'email_invitation_message', 'value' => 'secret copy']);

        $response = $this->getJson('/api/public/settings');

        $data = $response->assertOk()->json('data');

        $this->assertArrayHasKey('wedding_date', $data);
        $this->assertArrayNotHasKey('admin_email', $data);
        $this->assertArrayNotHasKey('email_invitation_message', $data);
    }
}
