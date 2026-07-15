<?php

namespace Database\Factories;

use App\Models\LiveUpdate;
use App\Models\ScheduleItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LiveUpdate>
 */
class LiveUpdateFactory extends Factory
{
    protected $model = LiveUpdate::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'schedule_item_id' => ScheduleItem::factory(),
            'message' => fake()->randomElement([
                'Ceremony is about to begin!',
                'Cocktail hour has started.',
                'Dinner service is now underway.',
                'First dance coming up next!',
                'Cake cutting in 10 minutes.',
                'Thank you all for being here!',
                'Photo session is underway.',
                'Open dancing has started.',
                'Last call for the bar!',
                'Grand exit in 15 minutes!',
            ]),
            'type' => fake()->randomElement(['normal', 'important', 'alert']),
        ];
    }
}
