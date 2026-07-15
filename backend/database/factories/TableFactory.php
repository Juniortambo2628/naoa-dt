<?php

namespace Database\Factories;

use App\Models\Table;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Table>
 */
class TableFactory extends Factory
{
    protected $model = Table::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement([
                'Head Table',
                'VIP Table',
                'Family Table',
                'Friends Table',
                'Colleagues Table',
            ]) . ' ' . fake()->numberBetween(1, 20),
            'capacity' => fake()->randomElement([6, 8, 10, 12]),
            'x' => fake()->numberBetween(50, 900),
            'y' => fake()->numberBetween(50, 600),
            'width' => fake()->randomElement([100, 120, 140, 160]),
            'height' => fake()->randomElement([80, 100, 120, 140]),
            'type' => fake()->randomElement(['round', 'rectangular', 'square', 'oval']),
        ];
    }
}
