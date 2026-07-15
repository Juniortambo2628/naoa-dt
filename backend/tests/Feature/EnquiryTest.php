<?php

namespace Tests\Feature;

use App\Models\Enquiry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EnquiryTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->admin = User::factory()->create();
    }

    public function test_public_can_submit_enquiry(): void
    {
        $response = $this->postJson('/api/enquiries', [
            'name' => 'John Guest',
            'email' => 'john-guest-enquiry@example.com',
            'type' => 'guest',
            'subject' => 'RSVP Question',
            'message' => 'Can I bring my partner?',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Your message has been sent successfully!',
            ]);

        $this->assertDatabaseHas('enquiries', [
            'name' => 'John Guest',
            'email' => 'john-guest-enquiry@example.com',
            'subject' => 'RSVP Question',
        ]);
    }

    public function test_admin_can_list_enquiries(): void
    {
        Enquiry::factory()->count(5)->create(['type' => 'guest']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/enquiries');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'email', 'subject', 'message'],
                ],
            ]);

        $this->assertCount(5, $response->json('data'));
    }

    public function test_admin_can_reply_to_enquiry(): void
    {
        $enquiry = Enquiry::factory()->pending()->create([
            'email' => 'guest-reply@example.com',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/enquiries/{$enquiry->id}/reply", [
                'message' => 'Yes, you can bring your partner!',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Reply sent successfully!',
            ]);

        $enquiry->refresh();
        $this->assertEquals('replied', $enquiry->status);
        $this->assertEquals('Yes, you can bring your partner!', $enquiry->reply_message);
        $this->assertNotNull($enquiry->replied_at);
    }

    public function test_admin_can_delete_enquiry(): void
    {
        $enquiry = Enquiry::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/enquiries/{$enquiry->id}");

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('enquiries', ['id' => $enquiry->id]);
    }

    public function test_unauthenticated_user_cannot_list_enquiries(): void
    {
        $response = $this->getJson('/api/enquiries');

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_reply_to_enquiry(): void
    {
        $enquiry = Enquiry::factory()->create();

        $response = $this->postJson("/api/enquiries/{$enquiry->id}/reply", [
            'message' => 'Test reply',
        ]);

        $response->assertStatus(401);
    }

    public function test_submit_requires_name_email_and_message(): void
    {
        $response = $this->postJson('/api/enquiries', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'message']);
    }

    public function test_reply_requires_message(): void
    {
        $enquiry = Enquiry::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/enquiries/{$enquiry->id}/reply", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }

    public function test_admin_can_view_single_enquiry(): void
    {
        $enquiry = Enquiry::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/enquiries/{$enquiry->id}");

        $response->assertOk()
            ->assertJson([
                'name' => $enquiry->name,
                'email' => $enquiry->email,
            ]);
    }

    public function test_enquiries_are_ordered_by_newest_first(): void
    {
        $old = Enquiry::factory()->create(['subject' => 'Old Enquiry Subject']);
        \Illuminate\Support\Facades\DB::table('enquiries')
            ->where('id', $old->id)
            ->update(['created_at' => now()->subDays(2)]);

        $new = Enquiry::factory()->create(['subject' => 'New Enquiry Subject']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/enquiries');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertEquals('New Enquiry Subject', $data[0]['subject']);
    }
}
