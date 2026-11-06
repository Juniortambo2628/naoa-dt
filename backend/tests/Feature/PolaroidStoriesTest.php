<?php

namespace Tests\Feature;

use App\Models\PolaroidImage;
use App\Models\PolaroidReaction;
use App\Models\PolaroidView;
use App\Models\User;
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

    public function test_per_photo_captions_are_stored_by_index(): void
    {
        $response = $this->postJson('/api/polaroid-images/batch', [
            'images' => [
                UploadedFile::fake()->image('one.jpg', 640, 480),
                UploadedFile::fake()->image('two.jpg', 640, 480),
                UploadedFile::fake()->image('three.jpg', 640, 480),
            ],
            'captions' => ['First one', ''],
            'caption' => 'The batch caption',
            'guest_name' => 'Nelly Okanda',
            'guest_code' => 'AAAA1111',
        ]);

        $response->assertStatus(201);
        $items = $response->json('data');

        $this->assertSame('First one', $items[0]['caption']);
        // An empty slot falls back to the batch caption…
        $this->assertSame('The batch caption', $items[1]['caption']);
        // …and so does anything past the captions array.
        $this->assertSame('The batch caption', $items[2]['caption']);

        $this->forgetStoredImages($items);
    }

    public function test_views_count_once_per_device_and_appear_in_stories(): void
    {
        $polaroid = PolaroidImage::create(['image_path' => '/storage/polaroids/a.jpg', 'taken_at' => '2026-11-02 10:00:00']);

        $this->postJson("/api/polaroid-images/{$polaroid->id}/viewed", ['guest_code' => 'AAAA1111'])
            ->assertOk()
            ->assertJsonPath('data.views', 1);

        // Watching again must not inflate the count.
        $this->postJson("/api/polaroid-images/{$polaroid->id}/viewed", ['guest_code' => 'AAAA1111'])
            ->assertOk()
            ->assertJsonPath('data.views', 1);

        $this->postJson("/api/polaroid-images/{$polaroid->id}/viewed", ['guest_code' => 'BBBB2222'])
            ->assertOk()
            ->assertJsonPath('data.views', 2);

        $stories = $this->getJson('/api/polaroid-images/stories')->json('data.stories');
        $this->assertSame(2, $stories[0]['items'][0]['views']);
    }

    public function test_viewed_needs_some_identifier(): void
    {
        $polaroid = PolaroidImage::create(['image_path' => '/storage/polaroids/a.jpg', 'taken_at' => '2026-11-02 10:00:00']);

        $this->postJson("/api/polaroid-images/{$polaroid->id}/viewed", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['guest_code', 'guest_name']);

        $this->assertDatabaseCount('polaroid_views', 0);
    }

    public function test_simulate_polaroid_provides_its_placeholder_image(): void
    {
        $path = storage_path('app/public/polaroids/placeholder.svg');
        $existed = file_exists($path);

        $admin = User::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/test/simulate/polaroid', [
                'note' => 'First dance',
                'location' => 'Main Hall',
            ])
            ->assertOk()
            ->assertJsonPath('data.image_path', '/storage/polaroids/placeholder.svg');

        // storage/ never ships with a release, so the simulate writes it.
        $this->assertFileExists($path);

        if (! $existed) {
            @unlink($path);
        }
    }

    public function test_a_new_reaction_pings_the_admin_but_changing_it_does_not(): void
    {
        $polaroid = PolaroidImage::create(['image_path' => '/storage/polaroids/a.jpg', 'taken_at' => '2026-11-02 10:00:00']);

        $this->postJson("/api/polaroid-images/{$polaroid->id}/reactions", [
            'emoji' => '❤️',
            'guest_name' => 'Nelly',
            'guest_code' => 'AAAA1111',
        ])->assertOk();

        $this->assertDatabaseHas('notifications', ['type' => 'PolaroidReaction']);
        $this->assertSame(1, \App\Models\Notification::where('type', 'PolaroidReaction')->count());

        // Changing the emoji updates in place: no second ping.
        $this->postJson("/api/polaroid-images/{$polaroid->id}/reactions", [
            'emoji' => '🔥',
            'guest_name' => 'Nelly',
            'guest_code' => 'AAAA1111',
        ])->assertOk();

        $this->assertSame(1, \App\Models\Notification::where('type', 'PolaroidReaction')->count());
    }

    public function test_a_guest_can_list_only_their_own_photos(): void
    {
        PolaroidImage::create(['image_path' => '/storage/polaroids/mine1.jpg', 'taken_at' => '2026-11-02 10:00:00', 'guest_code' => 'AAAA1111']);
        PolaroidImage::create(['image_path' => '/storage/polaroids/mine2.jpg', 'taken_at' => '2026-11-02 11:00:00', 'guest_code' => 'AAAA1111']);
        PolaroidImage::create(['image_path' => '/storage/polaroids/theirs.jpg', 'taken_at' => '2026-11-02 12:00:00', 'guest_code' => 'BBBB2222']);

        $response = $this->getJson('/api/polaroid-images/mine?guest_code=AAAA1111')->assertOk();

        $this->assertCount(2, $response->json('data'));
        $paths = array_column($response->json('data'), 'image_path');
        $this->assertNotContains('/storage/polaroids/theirs.jpg', $paths);
        // Newest first, so the manage grid reads in share order.
        $this->assertSame('/storage/polaroids/mine2.jpg', $paths[0]);
    }

    public function test_mine_needs_a_device_code(): void
    {
        $this->getJson('/api/polaroid-images/mine')
            ->assertStatus(422)
            ->assertJsonValidationErrors('guest_code');

        $this->getJson('/api/polaroid-images/mine?guest_code=')
            ->assertStatus(422)
            ->assertJsonValidationErrors('guest_code');
    }

    public function test_a_guest_can_delete_their_own_photo_and_its_counts(): void
    {
        Storage::disk('public')->put('polaroids/manage-me.jpg', '<svg/>');
        $polaroid = PolaroidImage::create([
            'image_path' => '/storage/polaroids/manage-me.jpg',
            'taken_at' => '2026-11-02 10:00:00',
            'guest_code' => 'AAAA1111',
        ]);
        PolaroidReaction::create(['polaroid_image_id' => $polaroid->id, 'emoji' => '❤️', 'guest_code' => 'AAAA1111']);
        PolaroidView::create(['polaroid_image_id' => $polaroid->id, 'guest_code' => 'AAAA1111']);

        $this->deleteJson("/api/polaroid-images/{$polaroid->id}/mine", ['guest_code' => 'AAAA1111'])
            ->assertOk();

        $this->assertDatabaseMissing('polaroid_images', ['id' => $polaroid->id]);
        $this->assertDatabaseCount('polaroid_reactions', 0);
        $this->assertDatabaseCount('polaroid_views', 0);
        $this->assertFileDoesNotExist(Storage::disk('public')->path('polaroids/manage-me.jpg'));
    }

    public function test_a_guest_cannot_delete_someone_elses_photo(): void
    {
        $polaroid = PolaroidImage::create([
            'image_path' => '/storage/polaroids/theirs.jpg',
            'taken_at' => '2026-11-02 10:00:00',
            'guest_code' => 'BBBB2222',
        ]);

        $this->deleteJson("/api/polaroid-images/{$polaroid->id}/mine", ['guest_code' => 'AAAA1111'])
            ->assertNotFound();

        $this->assertDatabaseHas('polaroid_images', ['id' => $polaroid->id]);
    }

    public function test_uncoded_photos_are_not_reachable_by_guests(): void
    {
        // Admin / Test Lab photos carry no device code: nothing to prove.
        $polaroid = PolaroidImage::create(['image_path' => '/storage/polaroids/a.jpg', 'taken_at' => '2026-11-02 10:00:00']);

        $this->deleteJson("/api/polaroid-images/{$polaroid->id}/mine", ['guest_code' => 'AAAA1111'])
            ->assertNotFound();

        $this->assertDatabaseHas('polaroid_images', ['id' => $polaroid->id]);
    }

    public function test_a_file_shared_by_several_photos_survives_until_the_last_one_goes(): void
    {
        Storage::disk('public')->put('polaroids/placeholder.svg', '<svg/>');
        $file = Storage::disk('public')->path('polaroids/placeholder.svg');
        $admin = User::factory()->create();

        $first = PolaroidImage::create(['image_path' => '/storage/polaroids/placeholder.svg', 'taken_at' => '2026-11-02 10:00:00']);
        $second = PolaroidImage::create(['image_path' => '/storage/polaroids/placeholder.svg', 'taken_at' => '2026-11-02 11:00:00']);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/polaroid-images/{$first->id}")
            ->assertOk();

        $this->assertDatabaseMissing('polaroid_images', ['id' => $first->id]);
        $this->assertFileExists($file); // the other photo still points at it

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/polaroid-images/{$second->id}")
            ->assertOk();

        $this->assertFileDoesNotExist($file);
    }
}
