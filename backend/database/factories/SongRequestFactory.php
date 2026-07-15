<?php

namespace Database\Factories;

use App\Models\SongRequest;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SongRequest>
 */
class SongRequestFactory extends Factory
{
    protected $model = SongRequest::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $songTitle = fake()->randomElement([
            'Dancing Queen',
            'Sweet Caroline',
            'Love Story',
            'Perfect',
            'Thinking Out Loud',
            'All of Me',
            'Uptown Funk',
            'Shut Up and Dance',
            'Don\'t Stop Believin\'',
            'September',
            'I Gotta Feeling',
            'Crazy in Love',
            'At Last',
            'The Way You Look Tonight',
            'Can\'t Help Falling in Love',
        ]);

        $artist = fake()->randomElement([
            'ABBA',
            'Neil Diamond',
            'Taylor Swift',
            'Ed Sheeran',
            'John Legend',
            'Bruno Mars',
            'Walking on Sunshine',
            'Earth, Wind & Fire',
            'Beyoncé',
            'Etta James',
            'Frank Sinatra',
            'Elvis Presley',
        ]);

        return [
            'guest_name' => fake()->name(),
            'song_data' => [
                'id' => fake()->uuid(),
                'title' => $songTitle,
                'artist' => $artist,
                'album' => fake()->words(3, true),
                'duration' => fake()->numberBetween(180, 360),
            ],
            'song_title' => $songTitle,
            'artist' => $artist,
            'is_played' => fake()->boolean(20),
            'played_at' => null,
        ];
    }

    /**
     * Indicate that the song has been played.
     */
    public function played(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_played' => true,
            'played_at' => fake()->dateTimeBetween('-7 days', 'now'),
        ]);
    }
}
