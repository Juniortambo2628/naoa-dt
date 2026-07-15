<?php

namespace Database\Factories;

use App\Models\Enquiry;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Enquiry>
 */
class EnquiryFactory extends Factory
{
    protected $model = Enquiry::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'type' => fake()->randomElement([
                'general',
                'rsvp',
                'accommodation',
                'transport',
                'dietary',
                'accessibility',
                'gift',
                'other',
            ]),
            'subject' => fake()->sentence(4),
            'message' => fake()->paragraph(3),
            'reply_message' => null,
            'replied_at' => null,
            'status' => fake()->randomElement(['pending', 'read', 'replied']),
        ];
    }

    /**
     * Indicate that the enquiry has been replied to.
     */
    public function replied(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'replied',
            'reply_message' => fake()->paragraph(2),
            'replied_at' => fake()->dateTimeBetween('-7 days', 'now'),
        ]);
    }

    /**
     * Indicate that the enquiry is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }
}
