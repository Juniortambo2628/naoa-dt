<?php

namespace Tests\Feature;

use App\Models\Table;
use App\Models\Guest;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_tables_endpoint_returns_tables_with_guests(): void
    {
        $table = Table::create([
            'name' => 'Family Table',
            'capacity' => 8,
            'type' => 'round',
        ]);

        Guest::create([
            'name' => 'Kevin Tambo',
            'unique_code' => 'LO2J85UX',
            'group' => 'Family',
            'table_id' => $table->id,
        ]);

        $response = $this->getJson('/api/tables/public');

        $response->assertOk()
            ->assertJsonCount(1)
            ->assertJsonFragment(['name' => 'Family Table']);
    }

    public function test_public_tables_endpoint_is_unauthenticated(): void
    {
        Table::create(['name' => 'Test', 'capacity' => 4, 'type' => 'round']);

        $response = $this->getJson('/api/tables/public');

        $response->assertOk();
    }

    public function test_weather_endpoint_returns_forecast(): void
    {
        Setting::create(['key' => 'venue_lat', 'value' => '-1.2921', 'group' => 'general']);
        Setting::create(['key' => 'venue_lng', 'value' => '36.8219', 'group' => 'general']);

        $response = $this->getJson('/api/weather');

        $response->assertOk();
    }

    public function test_weather_endpoint_is_unauthenticated(): void
    {
        $response = $this->getJson('/api/weather');

        // Should not return 401/403
        $response->assertDontSee('Unauthenticated');
    }

    public function test_settings_endpoint_returns_venue_coordinates(): void
    {
        Setting::create(['key' => 'venue_lat', 'value' => '-1.2921', 'group' => 'general']);
        Setting::create(['key' => 'venue_lng', 'value' => '36.8219', 'group' => 'general']);

        $admin = \App\Models\User::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/settings');

        $response->assertOk()
            ->assertJsonFragment(['venue_lat' => '-1.2921'])
            ->assertJsonFragment(['venue_lng' => '36.8219']);
    }

    public function test_health_check_endpoint(): void
    {
        $admin = \App\Models\User::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/test/health');

        $response->assertOk()
            ->assertJsonStructure([
                'status',
                'checks' => ['database', 'cache'],
                'timestamp',
            ]);
    }

    public function test_stats_endpoint(): void
    {
        $admin = \App\Models\User::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/test/stats');

        $response->assertOk()
            ->assertJsonStructure(['guests', 'tables', 'polaroid_images', 'schedule_events', 'live_updates']);
    }

    public function test_simulate_live_update_requires_message(): void
    {
        $admin = \App\Models\User::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/test/simulate/live-update', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('message');
    }

    public function test_simulate_live_update_creates_record(): void
    {
        $admin = \App\Models\User::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/test/simulate/live-update', [
                'message' => 'Ceremony starting soon!',
                'type' => 'normal',
            ]);

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Live update posted']);

        $this->assertDatabaseHas('live_updates', [
            'message' => 'Ceremony starting soon!',
            'type' => 'normal',
        ]);
    }
}
