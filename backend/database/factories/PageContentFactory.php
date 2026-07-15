<?php

namespace Database\Factories;

use App\Models\PageContent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PageContent>
 */
class PageContentFactory extends Factory
{
    protected $model = PageContent::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $sectionKey = fake()->unique()->randomElement([
            'hero',
            'about_us',
            'our_story',
            'wedding_party',
            'venue',
            'travel',
            'accommodations',
            'rsvp',
            'registry',
            'faq',
            'schedule',
            'gallery',
            'contact',
        ]);

        return [
            'section_key' => $sectionKey,
            'content' => $this->generateContent($sectionKey),
            'is_visible' => fake()->boolean(80),
        ];
    }

    /**
     * Generate realistic content based on section key.
     */
    private function generateContent(string $sectionKey): array
    {
        $contents = [
            'hero' => [
                'title' => fake()->sentence(3),
                'subtitle' => fake()->sentence(5),
                'image' => 'https://picsum.photos/seed/hero/1920/1080',
            ],
            'about_us' => [
                'heading' => 'About Us',
                'body' => fake()->paragraphs(2, true),
                'image' => 'https://picsum.photos/seed/about/800/600',
            ],
            'our_story' => [
                'heading' => 'Our Story',
                'body' => fake()->paragraphs(3, true),
                'timeline' => [
                    ['date' => fake()->dateTimeBetween('-3 years', '-2 years')->format('Y-m-d'), 'event' => 'First Met'],
                    ['date' => fake()->dateTimeBetween('-2 years', '-1 year')->format('Y-m-d'), 'event' => 'First Date'],
                    ['date' => fake()->dateTimeBetween('-1 year', '-6 months')->format('Y-m-d'), 'event' => 'Proposal'],
                ],
            ],
            'wedding_party' => [
                'heading' => 'Wedding Party',
                'members' => [
                    ['name' => fake()->name(), 'role' => 'Maid of Honor'],
                    ['name' => fake()->name(), 'role' => 'Best Man'],
                    ['name' => fake()->name(), 'role' => 'Bridesmaid'],
                    ['name' => fake()->name(), 'role' => 'Groomsman'],
                ],
            ],
            'venue' => [
                'heading' => 'The Venue',
                'name' => fake()->company() . ' Estate',
                'address' => fake()->address(),
                'description' => fake()->paragraph(),
                'image' => 'https://picsum.photos/seed/venue/800/600',
            ],
            'travel' => [
                'heading' => 'Getting There',
                'airport' => fake()->city() . ' International Airport',
                'driving' => fake()->paragraph(),
                'parking' => fake()->paragraph(),
            ],
            'accommodations' => [
                'heading' => 'Where to Stay',
                'hotels' => [
                    ['name' => fake()->company() . ' Hotel', 'address' => fake()->address(), 'price_range' => '$$$'],
                    ['name' => fake()->company() . ' Inn', 'address' => fake()->address(), 'price_range' => '$$'],
                ],
            ],
            'rsvp' => [
                'heading' => 'RSVP',
                'deadline' => fake()->dateTimeBetween('+30 days', '+60 days')->format('Y-m-d'),
                'message' => 'Please respond by the date above.',
            ],
            'registry' => [
                'heading' => 'Gift Registry',
                'message' => 'Your presence is the greatest gift. If you wish to give, here are some options.',
                'links' => [
                    ['store' => 'Amazon', 'url' => fake()->url()],
                    ['store' => 'Target', 'url' => fake()->url()],
                ],
            ],
            'faq' => [
                'heading' => 'Frequently Asked Questions',
                'items' => [
                    ['question' => 'What is the dress code?', 'answer' => 'Semi-formal attire.'],
                    ['question' => 'Are children invited?', 'answer' => 'We love your little ones, but this is an adults-only celebration.'],
                    ['question' => 'Can I bring a plus one?', 'answer' => 'Please check your invitation for details.'],
                ],
            ],
            'schedule' => [
                'heading' => 'Wedding Day Schedule',
                'events' => [
                    ['time' => '3:00 PM', 'event' => 'Guest Arrival'],
                    ['time' => '3:30 PM', 'event' => 'Ceremony Begins'],
                    ['time' => '4:30 PM', 'event' => 'Cocktail Hour'],
                    ['time' => '6:00 PM', 'event' => 'Reception'],
                ],
            ],
            'gallery' => [
                'heading' => 'Photo Gallery',
                'description' => 'Moments from our journey together.',
            ],
            'contact' => [
                'heading' => 'Contact Us',
                'email' => fake()->email(),
                'message' => 'Feel free to reach out with any questions!',
            ],
        ];

        return $contents[$sectionKey] ?? ['body' => fake()->paragraph()];
    }
}
