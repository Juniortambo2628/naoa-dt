<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\PushBroadcast;
use App\Models\PushSubscription;
use App\Models\User;
use App\Services\WebPushService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class PushNotificationTest extends TestCase
{
    use RefreshDatabase;

    private function subscriptionPayload(array $overrides = []): array
    {
        return array_merge([
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/abc123',
            'keys' => ['p256dh' => 'BPublicKeyValue', 'auth' => 'authSecret'],
        ], $overrides);
    }

    public function test_public_key_endpoint_returns_the_key(): void
    {
        $this->mock(WebPushService::class, fn ($m) => $m->shouldReceive('publicKey')->andReturn('BPUBLIC'));

        $this->getJson('/api/push/public-key')
            ->assertOk()
            ->assertJsonPath('data.public_key', 'BPUBLIC');
    }

    public function test_real_service_generates_vapid_keys_once(): void
    {
        $path = storage_path('app/webpush-vapid.json');
        @unlink($path);
        config(['services.webpush.public_key' => null, 'services.webpush.private_key' => null]);

        $first = (new WebPushService)->publicKey();
        $second = (new WebPushService)->publicKey();

        $this->assertNotEmpty($first);
        $this->assertSame($first, $second);
        @unlink($path);
    }

    public function test_guest_can_subscribe_and_is_linked_by_code(): void
    {
        $guest = Guest::factory()->create();

        $this->postJson('/api/push/subscribe', $this->subscriptionPayload(['code' => $guest->unique_code]))
            ->assertCreated();

        $this->assertDatabaseHas('push_subscriptions', [
            'guest_id' => $guest->id,
            'endpoint_hash' => PushSubscription::hashEndpoint('https://fcm.googleapis.com/fcm/send/abc123'),
        ]);
    }

    public function test_resubscribing_updates_the_same_device_and_keeps_the_guest(): void
    {
        $guest = Guest::factory()->create();
        $this->postJson('/api/push/subscribe', $this->subscriptionPayload(['code' => $guest->unique_code]))->assertCreated();
        $this->postJson('/api/push/subscribe', $this->subscriptionPayload(['keys' => ['p256dh' => 'BNew', 'auth' => 'newAuth']]))->assertCreated();

        $this->assertSame(1, PushSubscription::count());
        $sub = PushSubscription::first();
        $this->assertSame($guest->id, $sub->guest_id);
        $this->assertSame('BNew', $sub->public_key);
    }

    public function test_subscription_requires_an_https_endpoint(): void
    {
        $this->postJson('/api/push/subscribe', $this->subscriptionPayload(['endpoint' => 'http://insecure.example/x']))
            ->assertStatus(422);
    }

    public function test_guest_can_unsubscribe(): void
    {
        $this->postJson('/api/push/subscribe', $this->subscriptionPayload())->assertCreated();
        $this->postJson('/api/push/unsubscribe', ['endpoint' => 'https://fcm.googleapis.com/fcm/send/abc123'])->assertOk();

        $this->assertSame(0, PushSubscription::count());
    }

    public function test_admin_sees_stats_and_history(): void
    {
        $this->mock(WebPushService::class, fn ($m) => $m->shouldReceive('publicKey')->andReturn('BPUBLIC'));
        $confirmed = Guest::factory()->create(['rsvp_status' => 'confirmed']);
        $this->postJson('/api/push/subscribe', $this->subscriptionPayload(['code' => $confirmed->unique_code]))->assertCreated();

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson('/api/push')
            ->assertOk()
            ->assertJsonPath('data.available', true)
            ->assertJsonPath('data.stats.devices', 1)
            ->assertJsonPath('data.stats.confirmed_devices', 1);
    }

    public function test_admin_send_delivers_to_the_audience_and_records_counts(): void
    {
        $confirmed = Guest::factory()->create(['rsvp_status' => 'confirmed']);
        $pending = Guest::factory()->create(['rsvp_status' => 'pending']);
        $this->postJson('/api/push/subscribe', $this->subscriptionPayload(['code' => $confirmed->unique_code]))->assertCreated();
        $this->postJson('/api/push/subscribe', $this->subscriptionPayload([
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/other', 'code' => $pending->unique_code,
        ]))->assertCreated();

        $this->mock(WebPushService::class, function ($m) {
            $m->shouldReceive('send')->once()->withArgs(function ($subs, $payload) {
                return count($subs) === 1 && $payload($subs->first())['title'] === 'Shuttle';
            })->andReturn(['sent' => 1, 'failed' => 0, 'expired' => 0]);
        });

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->postJson('/api/push/send', [
                'title' => 'Shuttle', 'body' => 'Leaves at 1pm', 'url' => 'invite#programme', 'audience' => 'confirmed',
            ])
            ->assertCreated()
            ->assertJsonPath('data.recipients', 1);

        $broadcast = PushBroadcast::first();
        $this->assertSame('sent', $broadcast->status);
        $this->assertSame(1, $broadcast->sent_count);
    }

    public function test_each_guest_is_sent_to_their_own_invitation(): void
    {
        $guest = Guest::factory()->create(['unique_code' => 'ABC123']);
        $this->postJson('/api/push/subscribe', $this->subscriptionPayload(['code' => 'ABC123']))->assertCreated();
        $this->postJson('/api/push/subscribe', $this->subscriptionPayload(['endpoint' => 'https://fcm.googleapis.com/fcm/send/anon']))->assertCreated();

        $urls = [];
        $this->mock(WebPushService::class, function ($m) use (&$urls) {
            $m->shouldReceive('send')->andReturnUsing(function ($subs, $payload) use (&$urls) {
                foreach ($subs as $sub) {
                    $urls[] = $payload($sub)['url'];
                }

                return ['sent' => count($subs), 'failed' => 0, 'expired' => 0];
            });
        });

        $admin = User::factory()->create();
        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/push/send', ['title' => 'Hi', 'body' => 'Dinner', 'url' => 'invite#programme'])
            ->assertCreated();
        $this->assertEqualsCanonicalizing(['/invitation/ABC123#programme', '/rsvp'], $urls);

        // No link chosen: the invitation itself.
        $urls = [];
        $this->actingAs($admin, 'sanctum')->postJson('/api/push/send', ['title' => 'Hi', 'body' => 'x'])->assertCreated();
        $this->assertContains('/invitation/ABC123', $urls);
        $this->assertSame($guest->id, PushSubscription::whereNotNull('guest_id')->value('guest_id'));
    }

    public function test_send_rejects_malformed_invite_sections(): void
    {
        $admin = User::factory()->create();
        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/push/send', ['title' => 'x', 'body' => 'y', 'url' => 'invite#<script>'])
            ->assertStatus(422);
    }

    public function test_send_rejects_protocol_relative_links(): void
    {
        $this->actingAs(User::factory()->create(), 'sanctum')
            ->postJson('/api/push/send', ['title' => 'x', 'body' => 'y', 'url' => '//evil.example'])
            ->assertStatus(422);
    }

    public function test_viewer_cannot_send_and_guests_cannot_reach_admin_routes(): void
    {
        $this->postJson('/api/push/send', ['title' => 'x', 'body' => 'y'])->assertUnauthorized();

        $this->actingAs(User::factory()->viewer()->create(), 'sanctum')
            ->postJson('/api/push/send', ['title' => 'x', 'body' => 'y'])
            ->assertForbidden();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
