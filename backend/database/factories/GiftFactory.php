<?php

namespace Database\Factories;

use App\Models\Gift;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Gift>
 */
class GiftFactory extends Factory
{
    protected $model = Gift::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word() . ' ' . fake()->randomElement(['Set', 'Collection', 'Kit', 'Bundle', 'Essential']),
            'description' => fake()->sentence(8),
            'price' => fake()->randomFloat(2, 10, 500),
            'image_url' => 'https://picsum.photos/seed/' . fake()->uuid() . '/400/300',
            'product_link' => fake()->url(),
            'category' => fake()->randomElement(['kitchen', 'bedroom', 'bathroom', 'living', 'outdoor', 'dining', 'decor', 'experience']),
            'is_cash_fund' => false,
            'is_available' => true,
        ];
    }

    /**
     * Indicate that the gift is a cash fund.
     */
    public function cashFund(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_cash_fund' => true,
            'name' => fake()->randomElement([
                'Honeymoon Fund',
                'Home Deposit Fund',
                'Adventure Fund',
                'Future Fund',
                'Date Night Fund',
            ]),
            'product_link' => null,
        ]);
    }

    /**
     * Indicate that the gift is a physical gift.
     */
    public function physicalGift(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_cash_fund' => false,
        ]);
    }

    /**
     * Indicate that the gift is unavailable.
     */
    public function unavailable(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_available' => false,
        ]);
    }
}
