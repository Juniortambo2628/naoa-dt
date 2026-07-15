<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_admin_can_list_notifications(): void
    {
        Notification::factory()->count(5)->create([
            'notifiable_id' => $this->admin->id,
            'notifiable_type' => User::class,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/notifications');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data',
            ]);

        $this->assertCount(5, $response->json('data'));
    }

    public function test_admin_can_mark_all_read(): void
    {
        Notification::factory()->count(3)->create([
            'notifiable_id' => $this->admin->id,
            'notifiable_type' => User::class,
            'read_at' => null,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/notifications/mark-read');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'All notifications marked as read',
            ]);

        $this->assertEquals(0, Notification::whereNull('read_at')->count());
    }

    public function test_unauthenticated_user_cannot_list_notifications(): void
    {
        $response = $this->getJson('/api/notifications');

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_mark_read(): void
    {
        $response = $this->postJson('/api/notifications/mark-read');

        $response->assertStatus(401);
    }

    public function test_notifications_limited_to_ten(): void
    {
        Notification::factory()->count(15)->create([
            'notifiable_id' => $this->admin->id,
            'notifiable_type' => User::class,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/notifications');

        $response->assertOk();
        $this->assertCount(10, $response->json('data'));
    }

    public function test_notifications_ordered_by_newest_first(): void
    {
        $old = Notification::factory()->create([
            'notifiable_id' => $this->admin->id,
            'notifiable_type' => User::class,
            'data' => ['title' => 'Old notification', 'message' => 'Old msg', 'icon' => 'bell'],
        ]);
        \Illuminate\Support\Facades\DB::table('notifications')
            ->where('id', $old->id)
            ->update(['created_at' => now()->subDays(2)]);

        $new = Notification::factory()->create([
            'notifiable_id' => $this->admin->id,
            'notifiable_type' => User::class,
            'data' => ['title' => 'New notification', 'message' => 'New msg', 'icon' => 'bell'],
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/notifications');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertEquals('New notification', $data[0]['title']);
    }

    public function test_mark_all_read_only_affects_unread(): void
    {
        $readNotification = Notification::factory()->read()->create([
            'notifiable_id' => $this->admin->id,
            'notifiable_type' => User::class,
        ]);

        $unreadNotification = Notification::factory()->create([
            'notifiable_id' => $this->admin->id,
            'notifiable_type' => User::class,
            'read_at' => null,
        ]);

        $originalReadAt = $readNotification->read_at;

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/notifications/mark-read')
            ->assertOk();

        $readNotification->refresh();
        $this->assertEquals($originalReadAt->timestamp, $readNotification->read_at->timestamp);

        $unreadNotification->refresh();
        $this->assertNotNull($unreadNotification->read_at);
    }
}
