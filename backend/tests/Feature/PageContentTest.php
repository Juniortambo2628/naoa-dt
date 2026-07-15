<?php

namespace Tests\Feature;

use App\Models\PageContent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PageContentTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_public_can_get_content(): void
    {
        PageContent::factory()->create([
            'section_key' => 'test_hero',
            'content' => ['title' => 'Welcome'],
            'is_visible' => true,
        ]);

        $response = $this->getJson('/api/content');

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ]);

        $data = $response->json('data');
        $this->assertArrayHasKey('test_hero', $data);
    }

    public function test_public_can_get_content_by_key(): void
    {
        PageContent::factory()->create([
            'section_key' => 'test_venue',
            'content' => ['name' => 'Beautiful Venue'],
            'is_visible' => true,
        ]);

        $response = $this->getJson('/api/content/test_venue');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'section_key' => 'test_venue',
                ],
            ]);
    }

    public function test_admin_can_update_content(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/content/test_hero', [
                'content' => [
                    'title' => 'Our Wedding',
                    'subtitle' => 'Join us for our special day',
                ],
                'is_visible' => true,
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'section_key' => 'test_hero',
                ],
            ]);

        $this->assertDatabaseHas('page_contents', [
            'section_key' => 'test_hero',
            'is_visible' => true,
        ]);
    }

    public function test_admin_can_update_existing_content(): void
    {
        PageContent::create([
            'section_key' => 'test_hero_update',
            'content' => ['title' => 'Old Title'],
            'is_visible' => true,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/content/test_hero_update', [
                'content' => ['title' => 'New Title'],
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('page_contents', [
            'section_key' => 'test_hero_update',
        ]);

        $content = PageContent::where('section_key', 'test_hero_update')->first();
        $this->assertEquals('New Title', $content->content['title']);
    }

    public function test_public_does_not_see_hidden_content(): void
    {
        PageContent::create([
            'section_key' => 'test_hidden',
            'content' => ['title' => 'Hidden'],
            'is_visible' => false,
        ]);

        $response = $this->getJson('/api/content');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertArrayNotHasKey('test_hidden', $data);
    }

    public function test_nonexistent_key_returns_default(): void
    {
        $response = $this->getJson('/api/content/nonexistent_key_xyz');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'section_key' => 'nonexistent_key_xyz',
                    'is_visible' => true,
                ],
            ]);
    }

    public function test_unauthenticated_user_cannot_update_content(): void
    {
        $response = $this->postJson('/api/content/test_hero', [
            'content' => ['title' => 'Hacked'],
        ]);

        $response->assertStatus(401);
    }

    public function test_content_with_array_values(): void
    {
        $content = [
            'heading' => 'Wedding Party',
            'members' => [
                ['name' => 'Alice', 'role' => 'Maid of Honor'],
                ['name' => 'Bob', 'role' => 'Best Man'],
            ],
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/content/test_wedding_party', [
                'content' => $content,
            ]);

        $response->assertOk();

        $saved = PageContent::where('section_key', 'test_wedding_party')->first();
        $this->assertEquals('Alice', $saved->content['members'][0]['name']);
    }
}
