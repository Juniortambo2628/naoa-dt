<?php

namespace Tests\Feature;

use App\Models\Gift;
use App\Models\GiftClaim;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class GiftTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->admin = User::factory()->create();
    }

    public function test_public_can_list_gifts(): void
    {
        Gift::factory()->count(3)->create(['is_available' => true]);
        Gift::factory()->unavailable()->create();

        $response = $this->getJson('/api/gifts');

        $response->assertOk()
            ->assertJsonCount(3);
    }

    public function test_public_can_claim_gift(): void
    {
        $gift = Gift::factory()->physicalGift()->create(['is_available' => true]);

        $response = $this->postJson("/api/gifts/{$gift->id}/claim", [
            'name' => 'John Guest',
            'email' => 'john@guest.com',
            'message' => 'Congratulations!',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('gift_claims', [
            'gift_id' => $gift->id,
            'claimer_name' => 'John Guest',
        ]);
    }

    public function test_claimed_gift_cannot_be_claimed_again(): void
    {
        $gift = Gift::factory()->physicalGift()->create(['is_available' => true]);

        $this->postJson("/api/gifts/{$gift->id}/claim", [
            'name' => 'First Claimer',
            'email' => 'first@example.com',
        ])->assertStatus(201);

        $response = $this->postJson("/api/gifts/{$gift->id}/claim", [
            'name' => 'Second Claimer',
            'email' => 'second@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'This gift has already been reserved',
            ]);
    }

    public function test_cash_fund_can_be_claimed_multiple_times(): void
    {
        $gift = Gift::factory()->cashFund()->create(['is_available' => true]);

        $this->postJson("/api/gifts/{$gift->id}/claim", [
            'name' => 'First Contributor',
            'email' => 'first@example.com',
            'amount' => 50,
        ])->assertStatus(201);

        $response = $this->postJson("/api/gifts/{$gift->id}/claim", [
            'name' => 'Second Contributor',
            'email' => 'second@example.com',
            'amount' => 75,
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseCount('gift_claims', 2);
    }

    public function test_admin_can_create_gift(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/gifts', [
                'name' => 'Kitchen Mixer',
                'description' => 'A beautiful stand mixer',
                'price' => 299.99,
                'image_url' => 'https://example.com/mixer.jpg',
                'category' => 'kitchen',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => ['name' => 'Kitchen Mixer'],
            ]);

        $this->assertDatabaseHas('gifts', ['name' => 'Kitchen Mixer', 'price' => 299.99]);
    }

    public function test_admin_can_update_gift(): void
    {
        $gift = Gift::factory()->create(['name' => 'Old Name']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/gifts/{$gift->id}", [
                'name' => 'New Name',
                'price' => 199.99,
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => ['name' => 'New Name'],
            ]);

        $this->assertDatabaseHas('gifts', ['id' => $gift->id, 'name' => 'New Name']);
    }

    public function test_admin_can_delete_gift(): void
    {
        $gift = Gift::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/gifts/{$gift->id}");

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('gifts', ['id' => $gift->id]);
    }

    public function test_admin_can_get_statistics(): void
    {
        $physicalGifts = Gift::factory()->count(3)->physicalGift()->create();
        $cashFund = Gift::factory()->cashFund()->create();

        $gift = $physicalGifts->first();
        GiftClaim::factory()->create(['gift_id' => $gift->id, 'amount' => 150]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/gifts/statistics');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_gifts',
                    'claimed_gifts',
                    'total_value',
                    'cash_fund_total',
                ],
            ]);

        $data = $response->json('data');
        $this->assertEquals(4, $data['total_gifts']);
        $this->assertEquals(1, $data['claimed_gifts']);
    }

    public function test_unauthenticated_user_cannot_create_gift(): void
    {
        $response = $this->postJson('/api/gifts', [
            'name' => 'Test Gift',
        ]);

        $response->assertStatus(401);
    }

    public function test_claim_requires_name(): void
    {
        $gift = Gift::factory()->create();

        $response = $this->postJson("/api/gifts/{$gift->id}/claim", [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_unavailable_gifts_not_listed(): void
    {
        Gift::factory()->unavailable()->count(2)->create();
        Gift::factory()->count(1)->create();

        $response = $this->getJson('/api/gifts');

        $response->assertOk()
            ->assertJsonCount(1);
    }
}
