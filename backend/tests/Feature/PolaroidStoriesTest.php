<?php

namespace Tests\Feature;

use App\Models\PolaroidImage;
use App\Models\PolaroidReaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Snap Studio + Stories: guests share a burst of photos into the story feed,
 * stories are grouped per author, and anyone can tap a reaction on a post.
 */
class PolaroidStoriesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // The batch endpoint fires PolaroidImageCreated; keep the run free of
        // network calls (the real app broadcasts to Pusher, tests to the log).
        config(['broadcasting.default' => 'log']);
    }

    /** Remove any files a test wrote to storage/app/public/polaroids. */
    private function forgetStoredImages(array $items): void
    {
        foreach ($items as $item) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $item['image_path'] ?? ''));
        }
    }

    public function test_guest_can_share_a_burst_of_photos(): void
    {
        $response = $this->postJson('/api/polaroid-images/batch', [
            'images' => [
                UploadedFile::fake()->image('one.jpg', 1200, 900),
                UploadedFile::fake()->image('two.jpg', 1200, 900),
                UploadedFile::fake()->image('three.png', 800, 600),
            ],
            'guest_name' => 'Nelly Okanda',
            'guest_code' => 'ABCD1234',
            'caption' => 'Sunset drinks',
            'location' => 'Terrace',
        ]);

        $response->assertStatus(201);
        $this->assertCount(3, $response->json('data'));

        $this->assertDatabaseHas('polaroid_images', [
            'guest_name' => 'Nelly Okanda',
            'guest_code' => 'ABCD1234',
            'caption' => 'Sunset drinks',
            'location' => 'Terrace',
        ]);

        foreach ($response->json('data') as $item) {
            $this->assertStringStartsWith('/storage/polaroids/', $item['image_path']);
            $this->assertFileExists(storage_path('app/public/'.str_replace('/storage/', '', $item['image_path'])));
        }

        $this->forgetStoredImages($response->json('data'));
    }

    public function test_a_burst_needs_images_and_a_guest_name(): void
    {
        $this->postJson('/api/polaroid-images/batch', ['guest_name' => 'Nelly'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['images']);

        $this->postJson('/api/polaroid-images/batch', [
            'images' => [UploadedFile::fake()->image('one.jpg', 100, 100)],
        ])->assertStatus(422)->assertJsonValidationErrors(['guest_name']);

        $this->assertDatabaseCount('polaroid_images', 0);
    }

    public function test_a_burst_is_capped_at_ten_photos(): void
    {
        $images = [];
        for ($i = 0; $i < 11; $i++) {
            $images[] = UploadedFile::fake()->image("shot{$i}.jpg", 640, 480);
        }

        $this->postJson('/api/polaroid-images/batch', [
            'images' => $images,
            'guest_name' => 'Nelly Okanda',
        ])->assertStatus(422)->assertJsonValidationErrors(['images']);

        $this->assertDatabaseCount('polaroid_images', 0);
    }

    public function test_stories_group_by_author_and_hide_device_ids(): void
    {
        PolaroidImage::create(['image_path' => '/storage/polaroids/a.jpg', 'taken_at' => '2026-11-01 10:00:00']);
        PolaroidImage::create(['image_path' => '/storage/polaroids/b.jpg', 'taken_at' => '2026-11-01 11:00:00',
            'guest_name' => 'Nelly Okanda', 'guest_code' => 'AAAA1111']);
        PolaroidImage::create(['image_path' => '/storage/polaroids/c.jpg', 'taken_at' => '2026-11-02 09:00:00',
            'guest_name' => 'Nelly Okanda', 'guest_code' => 'AAAA1111']);
        PolaroidImage::create(['image_path' => '/storage/polaroids/d.jpg', 'taken_at' => '2026-11-01 12:00:00',
            'guest_name' => 'Kevin T', 'guest_code' => 'BBBB2222']);

        $response = $this->getJson('/api/polaroid-images/stories');

        $response->assertOk()->assertJsonPath('data.total', 4);
        $stories = $response->json('data.stories');
        $this->assertCount(3, $stories);

        // Newest story first…
        $this->assertSame('Nelly Okanda', $stories[0]['author']);
        // …oldest photo first inside a story, so playback runs forward.
        $this->assertSame(
            ['/storage/polaroids/b.jpg', '/storage/polaroids/c.jpg'],
            array_column($stories[0]['items'], 'image_path'),
        );
        $this->assertSame('The couple', $stories[2]['author']);
        $this->assertTrue($stories[2]['is_couple']);

        // The device id never leaves the server.
        $this->assertArrayNotHasKey('guest_code', $stories[0]);
        $this->assertArrayNotHasKey('guest_code', $stories[0]['items'][0]);
        $this->assertSame('2026-11-02T09:00:00+00:00', $stories[0]['items'][1]['taken_at']);
    }

    public function test_stories_report_reactions_including_the_viewers_own(): void
    {
        $polaroid = PolaroidImage::create(['image_path' => '/storage/polaroids/a.jpg', 'taken_at' => '2026-11-02 10:00:00']);
        PolaroidReaction::create(['polaroid_image_id' => $polaroid->id, 'emoji' => '❤️', 'guest_code' => 'AAAA1111']);
        PolaroidReaction::create(['polaroid_image_id' => $polaroid->id, 'emoji' => '❤️', 'guest_code' => 'BBBB2222']);
        PolaroidReaction::create(['polaroid_image_id' => $polaroid->id, 'emoji' => '🔥', 'guest_code' => 'CCCC3333']);

        $response = $this->getJson('/api/polaroid-images/stories?guest_code=AAAA1111');

        $reactions = $response->json('data.stories.0.items.0.reactions');
        $this->assertSame(3, $reactions['count']);
        $this->assertSame(2, $reactions['by_emoji']['❤️']);
        $this->assertSame('❤️', $reactions['mine']);
    }

    public function test_guest_can_react_and_change_their_reaction(): void
    {
        $polaroid = PolaroidImage::create(['image_path' => '/storage/polaroids/a.jpg', 'taken_at' => '2026-11-02 10:00:00']);

        $this->postJson("/api/polaroid-images/{$polaroid->id}/reactions", [
            'emoji' => '❤️',
            'guest_name' => 'Nelly',
            'guest_code' => 'AAAA1111',
        ])->assertOk()->assertJsonPath('data.count', 1)->assertJsonPath('data.mine', '❤️');

        // Changing your mind replaces the emoji instead of adding a second row.
        $this->postJson("/api/polaroid-images/{$polaroid->id}/reactions", [
            'emoji' => '🔥',
            'guest_name' => 'Nelly',
            'guest_code' => 'AAAA1111',
        ])->assertOk()->assertJsonPath('data.count', 1)->assertJsonPath('data.mine', '🔥');

        $this->assertDatabaseCount('polaroid_reactions', 1);
        $this->assertDatabaseHas('polaroid_reactions', ['polaroid_image_id' => $polaroid->id, 'emoji' => '🔥']);
    }

    public function test_reaction_emoji_must_be_from_the_offered_set(): void
    {
        $polaroid = PolaroidImage::create(['image_path' => '/storage/polaroids/a.jpg', 'taken_at' => '2026-11-02 10:00:00']);

        $this->postJson("/api/polaroid-images/{$polaroid->id}/reactions", [
            'emoji' => 'not-an-emoji',
            'guest_code' => 'AAAA1111',
        ])->assertStatus(422)->assertJsonValidationErrors('emoji');

        $this->postJson("/api/polaroid-images/{$polaroid->id}/reactions", ['guest_code' => 'AAAA1111'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('emoji');

        $this->assertDatabaseCount('polaroid_reactions', 0);
    }

    public function test_reaction_without_a_device_id_falls_back_to_the_name(): void
    {
        $polaroid = PolaroidImage::create(['image_path' => '/storage/polaroids/a.jpg', 'taken_at' => '2026-11-02 10:00:00']);

        $this->postJson("/api/polaroid-images/{$polaroid->id}/reactions", [
            'emoji' => '👏',
            'guest_name' => 'Anonymous Fan',
        ])->assertOk()->assertJsonPath('data.count', 1);

        $this->postJson("/api/polaroid-images/{$polaroid->id}/reactions", [
            'emoji' => '🎉',
            'guest_name' => 'Anonymous Fan',
        ])->assertOk()->assertJsonPath('data.count', 1);

        $this->assertDatabaseCount('polaroid_reactions', 1);
    }

    public function test_guest_can_remove_their_reaction(): void
    {
        $polaroid = PolaroidImage::create(['image_path' => '/storage/polaroids/a.jpg', 'taken_at' => '2026-11-02 10:00:00']);

        $this->postJson("/api/polaroid-images/{$polaroid->id}/reactions", [
            'emoji' => '❤️',
            'guest_code' => 'AAAA1111',
        ])->assertOk()->assertJsonPath('data.count', 1);

        $this->deleteJson("/api/polaroid-images/{$polaroid->id}/reactions", ['guest_code' => 'AAAA1111'])
            ->assertOk()
            ->assertJsonPath('data.count', 0)
            ->assertJsonPath('data.mine', null);

        $this->assertDatabaseCount('polaroid_reactions', 0);
    }

    public function test_the_feed_carries_reactions_but_never_the_device_id(): void
    {
        $polaroid = PolaroidImage::create(['image_path' => '/storage/polaroids/a.jpg', 'taken_at' => '2026-11-02 10:00:00',
            'guest_name' => 'Nelly Okanda', 'guest_code' => 'AAAA1111']);
        PolaroidReaction::create(['polaroid_image_id' => $polaroid->id, 'emoji' => '😍', 'guest_code' => 'BBBB2222']);

        $item = $this->getJson('/api/polaroid-images')->assertOk()->json('data.0');

        $this->assertArrayNotHasKey('guest_code', $item);
        $this->assertSame('Nelly Okanda', $item['guest_name']);
        $this->assertSame(1, $item['reactions']['count']);
        $this->assertNull($item['reactions']['mine']);
    }
}
