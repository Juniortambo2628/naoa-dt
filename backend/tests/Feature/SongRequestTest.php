<?php

namespace Tests\Feature;

use App\Models\SongRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SongRequestTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_public_can_list_song_requests(): void
    {
        SongRequest::factory()->count(3)->create();

        $response = $this->getJson('/api/song-requests');

        $response->assertOk()
            ->assertJsonStructure([
                'songs',
                'stats' => ['total', 'played', 'pending'],
            ]);

        $this->assertCount(3, $response->json('songs'));
    }

    public function test_public_can_submit_song_request(): void
    {
        $response = $this->postJson('/api/song-requests', [
            'guest_name' => 'Music Lover',
            'song_data' => [
                'name' => 'Perfect',
                'artist' => 'Ed Sheeran',
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('song_requests', [
            'guest_name' => 'Music Lover',
            'song_title' => 'Perfect',
            'artist' => 'Ed Sheeran',
        ]);
    }

    public function test_admin_can_mark_song_played(): void
    {
        $song = SongRequest::factory()->create(['is_played' => false]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/song-requests-admin/{$song->id}/played");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Song marked as played',
            ]);

        $song->refresh();
        $this->assertTrue($song->is_played);
        $this->assertNotNull($song->played_at);
    }

    public function test_admin_can_delete_song_request(): void
    {
        $song = SongRequest::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/song-requests-admin/{$song->id}");

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('song_requests', ['id' => $song->id]);
    }

    public function test_unauthenticated_user_cannot_mark_song_played(): void
    {
        $song = SongRequest::factory()->create();

        $response = $this->patchJson("/api/song-requests-admin/{$song->id}/played");

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_delete_song_request(): void
    {
        $song = SongRequest::factory()->create();

        $response = $this->deleteJson("/api/song-requests-admin/{$song->id}");

        $response->assertStatus(401);
    }

    public function test_submit_requires_guest_name_and_song_data(): void
    {
        $response = $this->postJson('/api/song-requests', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['guest_name', 'song_data']);
    }

    public function test_song_request_stats_are_accurate(): void
    {
        SongRequest::factory()->played()->count(2)->create();
        SongRequest::factory()->count(3)->create(['is_played' => false]);

        $response = $this->getJson('/api/song-requests');

        $response->assertOk();
        $stats = $response->json('stats');
        $this->assertEquals(5, $stats['total']);
        $this->assertEquals(2, $stats['played']);
        $this->assertEquals(3, $stats['pending']);
    }

    public function test_song_requests_are_ordered_by_creation_date(): void
    {
        $old = SongRequest::factory()->create(['song_title' => 'Old Song Title']);
        $old->update(['created_at' => now()->subDays(2)]);

        $new = SongRequest::factory()->create(['song_title' => 'New Song Title']);
        $new->update(['created_at' => now()]);

        $response = $this->getJson('/api/song-requests');

        $response->assertOk();
        $songs = $response->json('songs');
        $this->assertEquals('Old Song Title', $songs[0]['song_title']);
        $this->assertEquals('New Song Title', $songs[1]['song_title']);
    }
}
