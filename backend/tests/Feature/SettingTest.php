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
}
