<?php

namespace Database\Factories;

use App\Models\Guest;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Guest>
 */
class GuestFactory extends Factory
{
    protected $model = Guest::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'group' => fake()->randomElement(['family', 'friends', 'colleagues', 'vip']),
            'plus_ones_allowed' => fake()->numberBetween(0, 2),
            'unique_code' => strtoupper(Str::random(8)),
            'rsvp_status' => 'pending',
            'table_id' => null,
            'song_request' => null,
            'qr_code' => null,
            'checked_in_at' => null,
            'rsvp_message' => null,
            'dietary_notes' => null,
            'parent_guest_id' => null,
            'save_the_date_method' => fake()->randomElement(['email', 'sms', 'mail', null]),
            'invitation_via' => fake()->randomElement(['email', 'sms', 'whatsapp', null]),
        ];
    }

    /**
     * Indicate that the guest's RSVP is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'rsvp_status' => 'pending',
        ]);
    }

    /**
     * Indicate that the guest has confirmed their attendance.
     */
    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'rsvp_status' => 'confirmed',
        ]);
    }

    /**
     * Indicate that the guest has declined the invitation.
     */
    public function declined(): static
    {
        return $this->state(fn (array $attributes) => [
            'rsvp_status' => 'declined',
        ]);
    }

    /**
     * Indicate that the guest is a primary guest (not a plus one).
     */
    public function primary(): static
    {
        return $this->state(fn (array $attributes) => [
            'parent_guest_id' => null,
            'plus_ones_allowed' => fake()->numberBetween(1, 3),
        ]);
    }

    /**
     * Indicate that the guest has plus ones.
     */
    public function withPlusOnes(): static
    {
        return $this->state(fn (array $attributes) => [
            'plus_ones_allowed' => fake()->numberBetween(1, 3),
        ]);
    }

    /**
     * Indicate that the guest has checked in.
     */
    public function checkedIn(): static
    {
        return $this->state(fn (array $attributes) => [
            'checked_in_at' => fake()->dateTimeBetween('-1 day', 'now'),
        ]);
    }
}
