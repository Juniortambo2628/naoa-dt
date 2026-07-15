<?php

namespace Tests\Feature;

use App\Models\Faq;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FaqTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    public function test_public_can_list_faqs(): void
    {
        Faq::factory()->count(5)->create();

        $response = $this->getJson('/api/faqs');

        $response->assertOk()
            ->assertJsonCount(5)
            ->assertJsonStructure([
                '*' => ['id', 'question', 'answer', 'order'],
            ]);
    }

    public function test_faqs_are_ordered(): void
    {
        Faq::factory()->create(['order' => 3, 'question' => 'Third']);
        Faq::factory()->create(['order' => 1, 'question' => 'First']);
        Faq::factory()->create(['order' => 2, 'question' => 'Second']);

        $response = $this->getJson('/api/faqs');

        $response->assertOk();
        $data = $response->json();
        $this->assertEquals('First', $data[0]['question']);
        $this->assertEquals('Second', $data[1]['question']);
        $this->assertEquals('Third', $data[2]['question']);
    }

    public function test_admin_can_create_faq(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/faqs', [
                'question' => 'What is the dress code?',
                'answer' => 'Semi-formal attire is required.',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'question' => 'What is the dress code?',
                    'answer' => 'Semi-formal attire is required.',
                ],
            ]);

        $this->assertDatabaseHas('faqs', ['question' => 'What is the dress code?']);
    }

    public function test_admin_can_update_faq(): void
    {
        $faq = Faq::factory()->create(['question' => 'Old Question']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/faqs/{$faq->id}", [
                'question' => 'Updated Question',
                'answer' => 'Updated Answer',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => ['question' => 'Updated Question'],
            ]);

        $this->assertDatabaseHas('faqs', ['id' => $faq->id, 'question' => 'Updated Question']);
    }

    public function test_admin_can_delete_faq(): void
    {
        $faq = Faq::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/faqs/{$faq->id}");

        $response->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('faqs', ['id' => $faq->id]);
    }

    public function test_unauthenticated_user_cannot_create_faq(): void
    {
        $response = $this->postJson('/api/faqs', [
            'question' => 'Test?',
            'answer' => 'Test Answer',
        ]);

        $response->assertStatus(401);
    }

    public function test_create_faq_requires_question_and_answer(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/faqs', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['question', 'answer']);
    }

    public function test_update_faq_requires_question_and_answer(): void
    {
        $faq = Faq::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/faqs/{$faq->id}", [
                'question' => '',
                'answer' => '',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['question', 'answer']);
    }
}
