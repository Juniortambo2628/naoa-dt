<?php

namespace Database\Factories;

use App\Models\Faq;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Faq>
 */
class FaqFactory extends Factory
{
    protected $model = Faq::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'question' => fake()->randomElement([
                'What is the dress code?',
                'Are children invited to the wedding?',
                'Can I bring a plus one?',
                'What time should I arrive?',
                'Where is the venue located?',
                'Is there parking available?',
                'Will there be a vegetarian menu option?',
                'Can I take photos during the ceremony?',
                'Where are the recommended hotels?',
                'How do I RSVP?',
            ]),
            'answer' => fake()->paragraph(3),
            'order' => fake()->numberBetween(1, 20),
        ];
    }
}
