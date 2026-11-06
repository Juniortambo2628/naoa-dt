<?php

namespace Tests\Feature;

use App\Models\PolaroidImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Guards the admin CRUD routes against a silent failure mode: a route
 * parameter that doesn't match the controller's type-hinted argument makes
 * implicit binding never fire, so the method gets an empty model and
 * "succeeds" while touching nothing (or inserting a stray row).
 */
class AdminRouteBindingTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_admin_can_update_a_polaroid(): void
    {
        $polaroid = PolaroidImage::create([
            'image_path' => '/storage/polaroids/a.jpg',
            'taken_at' => '2026-11-02 10:00:00',
            'caption' => 'Before',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/polaroid-images/{$polaroid->id}", ['caption' => 'After'])
            ->assertOk();

        $this->assertDatabaseHas('polaroid_images', ['id' => $polaroid->id, 'caption' => 'After']);
        // The classic symptom of broken binding: a second, stray row.
        $this->assertDatabaseCount('polaroid_images', 1);
    }

    public function test_admin_can_delete_a_polaroid(): void
    {
        Storage::disk('public')->put('polaroids/admin-delete.jpg', 'x');
        $polaroid = PolaroidImage::create([
            'image_path' => '/storage/polaroids/admin-delete.jpg',
            'taken_at' => '2026-11-02 10:00:00',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/polaroid-images/{$polaroid->id}")
            ->assertOk();

        $this->assertDatabaseMissing('polaroid_images', ['id' => $polaroid->id]);
        $this->assertFileDoesNotExist(Storage::disk('public')->path('polaroids/admin-delete.jpg'));
    }

    public function test_admin_cannot_update_a_missing_polaroid(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/polaroid-images/999999', ['caption' => 'Ghost'])
            ->assertNotFound();

        $this->assertDatabaseCount('polaroid_images', 0);
    }
}
