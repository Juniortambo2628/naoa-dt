<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CheckInTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
        Storage::fake('local');
    }

    public function test_admin_can_generate_qr_for_guest(): void
    {
        $guest = Guest::factory()->create(['qr_code' => null]);

        $mockGenerator = \Mockery::mock(\SimpleSoftwareIO\QrCode\Generator::class);
        $mockGenerator->shouldReceive('format')->andReturnSelf();
        $mockGenerator->shouldReceive('size')->andReturnSelf();
        $mockGenerator->shouldReceive('margin')->andReturnSelf();
        $mockGenerator->shouldReceive('generate')->andReturn('fake-qr-binary-data');
        $this->app->instance(\SimpleSoftwareIO\QrCode\Generator::class, $mockGenerator);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/checkin/guests/{$guest->id}/generate-qr");

        $response->assertOk();

        $guest->refresh();
        $this->assertNotNull($guest->qr_code);
        $this->assertStringStartsWith('QR-', $guest->qr_code);
        $this->assertNotEmpty($response->json('data.qr_image'));
    }

    public function test_admin_generates_qr_only_once(): void
    {
        $guest = Guest::factory()->create(['qr_code' => 'QR-EXISTING1']);

        $mockGenerator = \Mockery::mock(\SimpleSoftwareIO\QrCode\Generator::class);
        $mockGenerator->shouldReceive('format')->andReturnSelf();
        $mockGenerator->shouldReceive('size')->andReturnSelf();
        $mockGenerator->shouldReceive('margin')->andReturnSelf();
        $mockGenerator->shouldReceive('generate')->andReturn('fake-qr-binary-data');
        $this->app->instance(\SimpleSoftwareIO\QrCode\Generator::class, $mockGenerator);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/checkin/guests/{$guest->id}/generate-qr");

        $response->assertOk();

        $guest->refresh();
        $this->assertEquals('QR-EXISTING1', $guest->qr_code);
    }

    public function test_admin_can_check_in_guest(): void
    {
        $guest = Guest::factory()->create([
            'qr_code' => 'QR-TESTCODE1',
            'checked_in_at' => null,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/checkin/scan', [
                'qr_code' => 'QR-TESTCODE1',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ]);

        $guest->refresh();
        $this->assertNotNull($guest->checked_in_at);
    }

    public function test_admin_can_get_checkin_stats(): void
    {
        Guest::factory()->confirmed()->count(5)->create();
        Guest::factory()->confirmed()->checkedIn()->count(3)->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/checkin/stats');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_expected',
                    'checked_in',
                    'remaining',
                    'percentage',
                ],
            ]);

        $data = $response->json('data');
        $this->assertEquals(8, $data['total_expected']);
        $this->assertEquals(3, $data['checked_in']);
        $this->assertEquals(5, $data['remaining']);
    }

    public function test_duplicate_checkin_rejected(): void
    {
        $guest = Guest::factory()->checkedIn()->create([
            'qr_code' => 'QR-DUPLICATE1',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/checkin/scan', [
                'qr_code' => 'QR-DUPLICATE1',
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_invalid_qr_code_rejected(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/checkin/scan', [
                'qr_code' => 'QR-NONEXISTENT',
            ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid QR code. Guest not found.',
            ]);
    }

    public function test_checkin_requires_qr_code(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/checkin/scan', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['qr_code']);
    }

    public function test_unauthenticated_user_cannot_generate_qr(): void
    {
        $guest = Guest::factory()->create();

        $response = $this->postJson("/api/checkin/guests/{$guest->id}/generate-qr");

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_check_in(): void
    {
        $response = $this->postJson('/api/checkin/scan', [
            'qr_code' => 'QR-TEST',
        ]);

        $response->assertStatus(401);
    }

    public function test_checkin_stats_exclude_non_confirmed_guests(): void
    {
        Guest::factory()->confirmed()->count(3)->create();
        Guest::factory()->pending()->count(2)->create();
        Guest::factory()->declined()->count(1)->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/checkin/stats');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertEquals(3, $data['total_expected']);
    }
}
