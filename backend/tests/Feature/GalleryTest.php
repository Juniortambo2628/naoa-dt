<?php

namespace Tests\Feature;

use App\Models\GalleryItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
