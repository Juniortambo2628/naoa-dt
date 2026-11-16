<?php

namespace Tests\Feature;

use App\Models\GalleryAlbum;
use App\Models\GalleryItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GalleryTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_public_can_list_gallery(): void
    {
        GalleryItem::factory()->count(3)->create(['is_visible' => true]);
        GalleryItem::factory()->create(['is_visible' => false]);

        $response = $this->getJson('/api/gallery');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data',
            ]);

        // Public should only see visible items
        $this->assertCount(3, $response->json('data'));
    }

    public function test_admin_can_see_all_gallery_items(): void
    {
        GalleryItem::factory()->count(2)->create(['is_visible' => true]);
        GalleryItem::factory()->count(2)->create(['is_visible' => false]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/gallery');

        $response->assertOk();
        $this->assertCount(4, $response->json('data'));
    }

    public function test_admin_can_create_gallery_item(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/gallery', [
                'image_url' => 'https://example.com/photo.jpg',
                'caption' => 'Beautiful moment',
                'order' => 1,
                'is_visible' => true,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'image_url' => 'https://example.com/photo.jpg',
                    'caption' => 'Beautiful moment',
                ],
            ]);

        $this->assertDatabaseHas('gallery_items', [
            'image_url' => 'https://example.com/photo.jpg',
        ]);
    }

    public function test_admin_can_update_gallery_item(): void
    {
        $item = GalleryItem::factory()->create(['caption' => 'Old Caption']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/gallery/{$item->id}", [
                'caption' => 'New Caption',
                'is_visible' => false,
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => ['caption' => 'New Caption'],
            ]);

        $this->assertDatabaseHas('gallery_items', [
            'id' => $item->id,
            'caption' => 'New Caption',
        ]);
    }

    public function test_admin_can_delete_gallery_item(): void
    {
        $item = GalleryItem::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/gallery/{$item->id}");

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('gallery_items', ['id' => $item->id]);
    }

    public function test_unauthenticated_user_cannot_create_gallery_item(): void
    {
        $response = $this->postJson('/api/gallery', [
            'image_url' => 'https://example.com/photo.jpg',
        ]);

        $response->assertStatus(401);
    }

    public function test_create_gallery_item_requires_image_url(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/gallery', [
                'caption' => 'No image',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['image_url']);
    }

    public function test_gallery_items_are_ordered(): void
    {
        GalleryItem::factory()->create(['order' => 3, 'is_visible' => true]);
        GalleryItem::factory()->create(['order' => 1, 'is_visible' => true]);
        GalleryItem::factory()->create(['order' => 2, 'is_visible' => true]);

        $response = $this->getJson('/api/gallery');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertEquals(1, $data[0]['order']);
        $this->assertEquals(2, $data[1]['order']);
        $this->assertEquals(3, $data[2]['order']);
    }

    public function test_guest_can_upload_a_photo_unauthenticated(): void
    {
        Storage::fake('public');

        $response = $this->postJson('/api/gallery/guest-upload', [
            'image' => UploadedFile::fake()->image('polaroid.jpg', 800, 800),
            'guest_name' => 'Kevin Omondi',
            'caption' => 'Great day!',
        ]);

        $response->assertCreated()
            ->assertJsonFragment([
                'uploaded_by' => 'Kevin Omondi',
                'caption' => 'Great day!',
                'is_guest_upload' => true,
            ]);

        $this->assertDatabaseHas('gallery_items', [
            'uploaded_by' => 'Kevin Omondi',
            'is_guest_upload' => true,
        ]);
    }

    public function test_guest_upload_requires_an_image_and_name(): void
    {
        $response = $this->postJson('/api/gallery/guest-upload', [
            'caption' => 'No image or name',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['image', 'guest_name']);
    }

    public function test_admin_can_reorder_items(): void
    {
        [$a, $b] = GalleryItem::factory()->count(2)->create();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/gallery/reorder', ['items' => [
                ['id' => $a->id, 'order' => 1],
                ['id' => $b->id, 'order' => 0],
            ]])
            ->assertOk();

        $this->assertSame(1, $a->fresh()->order);
        $this->assertSame(0, $b->fresh()->order);
    }

    public function test_reorder_rejects_unknown_items(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/gallery/reorder', ['items' => [['id' => 999, 'order' => 0]]])
            ->assertStatus(422);
    }

    private function cleanUp(GalleryItem $item): void
    {
        foreach ([$item->image_url, $item->thumb_url] as $url) {
            if ($url && is_file(public_path(ltrim($url, '/')))) {
                unlink(public_path(ltrim($url, '/')));
            }
        }
    }

    public function test_albums_list_in_the_order_things_happened(): void
    {
        $albums = $this->getJson('/api/gallery/albums')->assertOk()->json('data');

        // The Ayie (Thursday) comes before the wedding (Saturday).
        $this->assertSame(['Ayie', 'The Wedding'], array_column($albums, 'title'));
        $this->assertSame('2026-11-12', $albums[0]['event_date']);
    }

    public function test_albums_count_only_visible_photos_for_guests(): void
    {
        $album = GalleryAlbum::where('title', 'Ayie')->first();
        GalleryItem::factory()->count(2)->create(['gallery_album_id' => $album->id, 'is_visible' => true]);
        GalleryItem::factory()->create(['gallery_album_id' => $album->id, 'is_visible' => false]);

        $public = collect($this->getJson('/api/gallery/albums')->json('data'))->firstWhere('id', $album->id);
        $admin = collect($this->actingAs($this->admin, 'sanctum')->getJson('/api/gallery/albums')->json('data'))->firstWhere('id', $album->id);

        $this->assertSame(2, $public['photo_count']);
        $this->assertSame(3, $admin['photo_count']);
    }

    public function test_admin_can_manage_albums_and_removing_one_keeps_its_photos(): void
    {
        $id = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/gallery/albums', ['title' => 'Reception', 'event_date' => '2026-11-14'])
            ->assertCreated()->json('data.id');

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/gallery/albums/{$id}", ['subtitle' => 'Evening'])
            ->assertOk()->assertJsonPath('data.subtitle', 'Evening');

        $photo = GalleryItem::factory()->create(['gallery_album_id' => $id]);

        $this->actingAs($this->admin, 'sanctum')->deleteJson("/api/gallery/albums/{$id}")->assertOk();

        $this->assertDatabaseMissing('gallery_albums', ['id' => $id]);
        $this->assertNull($photo->fresh()->gallery_album_id);
    }

    public function test_guests_cannot_change_albums_or_import(): void
    {
        $this->postJson('/api/gallery/albums', ['title' => 'X'])->assertUnauthorized();
        $this->postJson('/api/gallery/import', [])->assertUnauthorized();
    }

    public function test_import_stores_a_web_copy_and_thumbnail_in_the_album(): void
    {
        $album = GalleryAlbum::where('title', 'The Wedding')->first();

        $response = $this->actingAs($this->admin, 'sanctum')->post('/api/gallery/import', [
            'image' => UploadedFile::fake()->image('DSC_0001.jpg', 1600, 1200),
            'gallery_album_id' => $album->id,
            'original_name' => 'DSC_0001.jpg',
            'taken_at' => '2026-11-14 14:05:00',
        ], ['Accept' => 'application/json']);

        $response->assertCreated()->assertJsonPath('data.skipped', false);
        $item = GalleryItem::findOrFail($response->json('data.item.id'));

        $this->assertSame($album->id, $item->gallery_album_id);
        $this->assertSame('2026-11-14 14:05:00', $item->taken_at->format('Y-m-d H:i:s'));
        $this->assertStringStartsWith('/uploads/gallery/thumbs/', $item->thumb_url);
        $this->assertFileExists(public_path(ltrim($item->image_url, '/')));
        $this->assertFileExists(public_path(ltrim($item->thumb_url, '/')));
        $this->assertSame(1600, $item->width);

        $this->cleanUp($item);
    }

    public function test_importing_the_same_file_again_skips_it(): void
    {
        $album = GalleryAlbum::where('title', 'Ayie')->first();
        $send = fn () => $this->actingAs($this->admin, 'sanctum')->post('/api/gallery/import', [
            'image' => UploadedFile::fake()->image('IMG_9.jpg', 800, 600),
            'gallery_album_id' => $album->id,
            'original_name' => 'IMG_9.jpg',
        ], ['Accept' => 'application/json']);

        $first = $send()->assertCreated();
        $send()->assertOk()->assertJsonPath('data.skipped', true);

        $this->assertSame(1, GalleryItem::where('original_name', 'IMG_9.jpg')->count());
        $this->cleanUp(GalleryItem::findOrFail($first->json('data.item.id')));
    }

    public function test_admin_can_feature_a_photo_and_move_it_to_an_album(): void
    {
        $album = GalleryAlbum::first();
        $photo = GalleryItem::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/gallery/{$photo->id}", ['is_featured' => true, 'gallery_album_id' => $album->id])
            ->assertOk();

        $this->assertTrue($photo->fresh()->is_featured);
        $this->assertSame($album->id, $photo->fresh()->gallery_album_id);
    }
}
