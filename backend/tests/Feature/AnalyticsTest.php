<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnalyticsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_admin_can_get_analytics(): void
    {
        Guest::factory()->confirmed()->count(5)->create();
        Guest::factory()->declined()->count(2)->create();
        Guest::factory()->pending()->count(3)->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/analytics');

        $response->assertOk()
            ->assertJsonStructure([
                'rsvpStatus',
                'groups',
                'summary',
                'timeline',
            ]);

        $summary = $response->json('summary');
        $this->assertEquals(10, $summary['totalGuests']);
        $this->assertEquals(5, $summary['totalConfirmed']);
        $this->assertEquals(3, $summary['pendingResponses']);
    }

    public function test_analytics_rsvp_status_breakdown(): void
    {
        Guest::factory()->confirmed()->count(4)->create();
        Guest::factory()->pending()->count(1)->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/analytics');

        $response->assertOk();
        $rsvpStatus = $response->json('rsvpStatus');

        $confirmed = collect($rsvpStatus)->firstWhere('name', 'Confirmed');
        $this->assertEquals(4, $confirmed['value']);

        $pending = collect($rsvpStatus)->firstWhere('name', 'Pending');
        $this->assertEquals(1, $pending['value']);
    }

    public function test_analytics_group_breakdown(): void
    {
        Guest::factory()->count(3)->create(['group' => 'family']);
        Guest::factory()->count(2)->create(['group' => 'friends']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/analytics');

        $response->assertOk();
        $groups = $response->json('groups');

        $family = collect($groups)->firstWhere('name', 'family');
        $this->assertEquals(3, $family['value']);

        $friends = collect($groups)->firstWhere('name', 'friends');
        $this->assertEquals(2, $friends['value']);
    }

    public function test_analytics_empty_state(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/analytics');

        $response->assertOk();

        $summary = $response->json('summary');
        $this->assertEquals(0, $summary['totalGuests']);
        $this->assertEquals(0, $summary['totalConfirmed']);
    }

    public function test_unauthenticated_user_cannot_get_analytics(): void
    {
        $response = $this->getJson('/api/analytics');

        $response->assertStatus(401);
    }

    public function test_analytics_includes_plus_ones_count(): void
    {
        Guest::factory()->confirmed()->count(2)->create();
        Guest::factory()->count(3)->create(['parent_guest_id' => 1]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/analytics');

        $response->assertOk();
        $summary = $response->json('summary');
        $this->assertEquals(3, $summary['totalPlusOnes']);
    }
}
