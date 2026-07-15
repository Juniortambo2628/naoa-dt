<?php

namespace Database\Factories;

use App\Models\GuestbookEntry;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GuestbookEntry>
 */
class GuestbookEntryFactory extends Factory
{
    protected $model = GuestbookEntry::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'guest_name' => fake()->name(),
            'message' => fake()->randomElement([
                'Wishing you both a lifetime of love and happiness!',
                'Thank you for letting us be part of your special day!',
                'May your love story be as beautiful as this celebration!',
                'Here\'s to a lifetime of love, laughter, and happily ever after!',
                'What a beautiful couple! Congratulations on your wedding!',
                'So happy to celebrate this wonderful day with you both!',
                'Your love is an inspiration. Best wishes for the future!',
                'Cheers to love, laughter, and happily ever after!',
            ]),
            'is_approved' => fake()->boolean(70),
        ];
    }

    /**
     * Indicate that the entry has been approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_approved' => true,
        ]);
    }

    /**
     * Indicate that the entry is pending approval.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_approved' => false,
        ]);
    }
}
