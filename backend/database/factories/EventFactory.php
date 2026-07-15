<?php

namespace Database\Factories;

use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Event>
 */
class EventFactory extends Factory
{
    protected $model = Event::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement([
                'Wedding Ceremony',
                'Wedding Reception',
                'Rehearsal Dinner',
                'Welcome Party',
                'Day-After Brunch',
                'Engagement Party',
            ]),
            'event_date' => fake()->dateTimeBetween('+30 days', '+365 days'),
            'event_time' => fake()->time('H:i'),
            'venue' => fake()->company() . ' Venue',
            'description' => fake()->sentence(10),
        ];
    }
}
