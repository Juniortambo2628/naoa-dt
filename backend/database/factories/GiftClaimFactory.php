<?php

namespace Database\Factories;

use App\Models\Gift;
use App\Models\GiftClaim;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GiftClaim>
 */
class GiftClaimFactory extends Factory
{
    protected $model = GiftClaim::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'gift_id' => Gift::factory(),
            'guest_id' => null,
            'claimer_name' => fake()->name(),
            'claimer_email' => fake()->safeEmail(),
            'amount' => fake()->optional(0.7, 0)->randomFloat(2, 10, 500),
            'message' => fake()->optional(0.6)->sentence(6),
            'is_purchased' => fake()->boolean(30),
        ];
    }
}
