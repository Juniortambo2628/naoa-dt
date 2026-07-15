<?php

namespace Database\Factories;

use App\Models\Guest;
use App\Models\Invitation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Invitation>
 */
class InvitationFactory extends Factory
{
    protected $model = Invitation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'guest_id' => Guest::factory(),
            'status' => 'pending',
            'sent_at' => null,
            'opened_at' => null,
        ];
    }

    /**
     * Indicate that the invitation has been sent.
     */
    public function sent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'sent',
            'sent_at' => fake()->dateTimeBetween('-30 days', 'now'),
        ]);
    }

    /**
     * Indicate that the invitation has been opened.
     */
    public function opened(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'opened',
            'sent_at' => fake()->dateTimeBetween('-30 days', 'now'),
            'opened_at' => fake()->dateTimeBetween('-7 days', 'now'),
        ]);
    }
}
