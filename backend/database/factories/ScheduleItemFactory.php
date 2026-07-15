<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\ScheduleItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ScheduleItem>
 */
class ScheduleItemFactory extends Factory
{
    protected $model = ScheduleItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startTime = fake()->dateTimeBetween('+1 hour', '+4 hours');
        $endTime = (clone $startTime)->modify('+' . fake()->numberBetween(15, 120) . ' minutes');

        return [
            'event_id' => Event::factory(),
            'title' => fake()->randomElement([
                'Ceremony',
                'Cocktail Hour',
                'Reception',
                'First Dance',
                'Cake Cutting',
                'Toasts & Speeches',
                'Dinner Service',
                'Bouquet Toss',
                'Parent Dances',
                'Open Dancing',
                'Grand Exit',
                'Photo Session',
            ]),
            'start_time' => $startTime->format('H:i'),
            'end_time' => $endTime->format('H:i'),
            'description' => fake()->optional(0.6)->sentence(8),
            'location' => fake()->optional(0.7)->randomElement([
                'Main Hall',
                'Garden',
                'Terrace',
                'Ballroom',
                'Courtyard',
                'Chapel',
                'Lounge',
            ]),
            'type' => fake()->randomElement(['ceremony', 'reception', 'activity', 'meal', 'entertainment']),
            'status' => fake()->randomElement(['upcoming', 'current', 'completed']),
            'order' => fake()->numberBetween(1, 20),
        ];
    }
}
