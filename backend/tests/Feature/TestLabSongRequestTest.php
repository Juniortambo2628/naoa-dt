<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\SongRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The Test Lab's song request tools (admin testing page):
 * simulate a request, and run the feature's own end-to-end checks.
 */
class TestLabSongRequestTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_stats_include_the_song_request_count(): void
    {
        SongRequest::factory()->count(2)->create();

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/test/stats')
            ->assertOk()
            ->assertJsonPath('data.song_requests', 2);
    }

    public function test_simulate_song_request_creates_a_pending_request(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/test/simulate/song-request', [
                'song_title' => 'Test Lab Song',
                'artist' => 'Test Lab Artist',
                'guest_name' => 'Test Lab',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.song_title', 'Test Lab Song')
            ->assertJsonPath('data.is_played', false);

        $this->assertDatabaseHas('song_requests', [
            'guest_name' => 'Test Lab',
            'song_title' => 'Test Lab Song',
            'artist' => 'Test Lab Artist',
            'is_played' => false,
        ]);
    }

    public function test_simulate_song_request_fills_in_defaults(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/test/simulate/song-request', ['song_title' => 'Solo Title'])
            ->assertStatus(201)
            ->assertJsonPath('data.guest_name', 'Test Lab')
            ->assertJsonPath('data.artist', 'Test Lab');
    }

    public function test_simulate_song_request_requires_a_title(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/test/simulate/song-request', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('song_title');

        $this->assertDatabaseCount('song_requests', 0);
    }

    public function test_simulate_song_request_requires_signing_in(): void
    {
        $this->postJson('/api/test/simulate/song-request', ['song_title' => 'Nope'])
            ->assertStatus(401);

        $this->assertDatabaseCount('song_requests', 0);
    }

    public function test_viewers_cannot_simulate_song_requests(): void
    {
        $viewer = User::factory()->viewer()->create();

        $this->actingAs($viewer, 'sanctum')
            ->postJson('/api/test/simulate/song-request', ['song_title' => 'Nope'])
            ->assertStatus(403)
            ->assertJsonPath('reason', 'role');

        $this->assertDatabaseCount('song_requests', 0);
    }

    public function test_song_request_checks_pass_and_leave_no_residue(): void
    {
        SongRequest::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/test/song-requests/checks');

        $response->assertOk()
            ->assertJsonPath('data.failed', 0)
            ->assertJsonPath('data.passed', 6);

        foreach ($response->json('data.steps') as $step) {
            $this->assertSame('ok', $step['status'], "{$step['name']}: {$step['message']}");
        }

        // The only row left is the one that existed before the checks ran.
        $this->assertDatabaseCount('song_requests', 1);
    }

    public function test_song_request_checks_start_from_an_empty_table(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/test/song-requests/checks');

        $response->assertOk()
            ->assertJsonPath('data.failed', 0);

        $this->assertDatabaseCount('song_requests', 0);
    }

    public function test_song_request_checks_require_signing_in(): void
    {
        $this->postJson('/api/test/song-requests/checks')->assertStatus(401);
    }

    public function test_viewers_cannot_run_song_request_checks(): void
    {
        $viewer = User::factory()->viewer()->create();

        $this->actingAs($viewer, 'sanctum')
            ->postJson('/api/test/song-requests/checks')
            ->assertStatus(403);

        $this->assertDatabaseCount('song_requests', 0);
    }

    public function test_song_request_limit_checks_pass_and_roll_back(): void
    {
        // A real request sitting in the current hour: its timestamp must come
        // back exactly as it was once the checks roll the transaction back.
        $existing = SongRequest::factory()->create(['created_at' => now()]);
        $originalCreatedAt = $existing->created_at->toDateTimeString();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/test/song-requests/limit-checks');

        $response->assertOk()
            ->assertJsonPath('data.failed', 0)
            ->assertJsonPath('data.passed', 5);

        foreach ($response->json('data.steps') as $step) {
            $this->assertSame('ok', $step['status'], "{$step['name']}: {$step['message']}");
        }

        // Nothing survived: the same row with the same timestamp.
        $this->assertDatabaseCount('song_requests', 1);
        $this->assertSame($originalCreatedAt, $existing->fresh()->created_at->toDateTimeString());
    }

    public function test_song_request_limit_checks_leave_a_disabled_toggle_disabled(): void
    {
        Setting::updateOrCreate(
            ['key' => 'song_request_limit_enabled'],
            ['value' => 'false', 'group' => 'general']
        );

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/test/song-requests/limit-checks');

        // The run turns the limit on for itself, then rolls that back too.
        $response->assertOk()->assertJsonPath('data.failed', 0);

        $this->assertSame('false', Setting::getValue('song_request_limit_enabled'));
        $this->assertDatabaseCount('song_requests', 0);
    }

    public function test_song_request_limit_checks_report_the_configured_state(): void
    {
        Setting::updateOrCreate(
            ['key' => 'song_request_limit_enabled'],
            ['value' => 'false', 'group' => 'general']
        );

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/test/song-requests/limit-checks');

        $this->assertStringStartsWith('Disabled', $response->json('data.steps.0.message'));
    }

    public function test_song_request_limit_checks_require_signing_in(): void
    {
        $this->postJson('/api/test/song-requests/limit-checks')->assertStatus(401);
    }

    public function test_viewers_cannot_run_song_request_limit_checks(): void
    {
        $viewer = User::factory()->viewer()->create();

        $this->actingAs($viewer, 'sanctum')
            ->postJson('/api/test/song-requests/limit-checks')
            ->assertStatus(403);

        $this->assertDatabaseCount('song_requests', 0);
    }
}
