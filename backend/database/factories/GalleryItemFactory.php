<?php

namespace Database\Factories;

use App\Models\GalleryItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GalleryItem>
 */
class GalleryItemFactory extends Factory
{
    protected $model = GalleryItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'image_url' => 'https://picsum.photos/seed/' . fake()->uuid() . '/800/600',
            'caption' => fake()->optional(0.8)->sentence(4),
            'order' => fake()->numberBetween(1, 100),
            'is_visible' => fake()->boolean(80),
            'object_position' => fake()->randomElement(['center', 'top', 'bottom', 'left', 'right']),
            'uploaded_by' => fake()->optional(0.7)->name(),
            'is_guest_upload' => fake()->boolean(30),
        ];
    }
}
