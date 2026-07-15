<?php

namespace Database\Factories;

use App\Models\PolaroidImage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PolaroidImage>
 */
class PolaroidImageFactory extends Factory
{
    protected $model = PolaroidImage::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'image_path' => 'uploads/polaroids/' . fake()->uuid() . '.jpg',
            'note' => fake()->optional(0.7)->sentence(4),
            'custom_size' => fake()->randomElement(['small', 'medium', 'large', 'original']),
            'offset_x' => fake()->numberBetween(-20, 20),
            'offset_y' => fake()->numberBetween(-20, 20),
            'rotation' => fake()->numberBetween(-15, 15),
            'location' => fake()->optional(0.8)->randomElement([
                'ceremony',
                'cocktail_hour',
                'reception',
                'photo_booth',
                'dance_floor',
                'bar',
                'garden',
                'entrance',
            ]),
        ];
    }
}
