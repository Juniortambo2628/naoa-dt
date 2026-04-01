<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Guest;
use App\Models\Event;
use App\Models\ScheduleItem;
use App\Models\Gift;
use App\Models\Invitation;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        User::create([
            'name' => 'Wedding Admin',
            'email' => 'admin@wedding.com',
            'password' => Hash::make('password123'),
        ]);

        // Create wedding event
        $event = Event::create([
            'name' => 'Sarah & James Wedding',
            'event_date' => '2025-06-15',
            'event_time' => '14:00',
            'venue' => 'Rosewood Manor, Karen, Nairobi',
            'description' => 'Join us for our special day!',
        ]);

        // Create schedule items
        $scheduleItems = [
            [
                'title' => 'Guest Arrival',
                'start_time' => '13:30',
                'end_time' => '14:00',
                'description' => 'Welcome drinks and light refreshments as guests arrive at the venue.',
                'location' => 'Main Entrance',
                'type' => 'default',
                'order' => 1,
            ],
            [
                'title' => 'Wedding Ceremony',
                'start_time' => '14:00',
                'end_time' => '15:00',
                'description' => 'Join us as we exchange our vows in an intimate garden ceremony surrounded by loved ones.',
                'location' => 'Garden Pavilion',
                'type' => 'ceremony',
                'order' => 2,
            ],
            [
                'title' => 'Photo Session',
                'start_time' => '15:00',
                'end_time' => '16:00',
                'description' => 'Family and wedding party photos. Guests can enjoy the cocktail hour.',
                'location' => 'Rose Garden',
                'type' => 'photos',
                'order' => 3,
            ],
            [
                'title' => 'Cocktail Hour',
                'start_time' => '16:00',
                'end_time' => '17:30',
                'description' => 'Enjoy signature cocktails and hors d\'oeuvres while mingling with other guests.',
                'location' => 'Terrace',
                'type' => 'cocktails',
                'order' => 4,
            ],
            [
                'title' => 'Reception Dinner',
                'start_time' => '17:30',
                'end_time' => '19:30',
                'description' => 'A three-course dinner featuring locally sourced ingredients and the couple\'s favorite dishes.',
                'location' => 'Grand Ballroom',
                'type' => 'dinner',
                'order' => 5,
            ],
            [
                'title' => 'First Dance & Speeches',
                'start_time' => '19:30',
                'end_time' => '20:30',
                'description' => 'Watch the newlyweds share their first dance, followed by heartfelt speeches.',
                'location' => 'Grand Ballroom',
                'type' => 'dancing',
                'order' => 6,
            ],
            [
                'title' => 'Party Time!',
                'start_time' => '20:30',
                'end_time' => '23:00',
                'description' => 'Dance the night away with live music and entertainment. Open bar continues.',
                'location' => 'Grand Ballroom',
                'type' => 'dancing',
                'order' => 7,
            ],
        ];

        foreach ($scheduleItems as $item) {
            $event->scheduleItems()->create($item);
        }

        // Create sample guests
        $guests = [
            ['name' => 'John Kamau', 'email' => 'john@example.com', 'group' => 'Family', 'plus_ones_allowed' => 1],
            ['name' => 'Mary Wanjiku', 'email' => 'mary@example.com', 'group' => 'Family', 'plus_ones_allowed' => 2],
            ['name' => 'Peter Otieno', 'email' => 'peter@example.com', 'group' => 'Friends', 'plus_ones_allowed' => 1],
            ['name' => 'Grace Muthoni', 'email' => 'grace@example.com', 'group' => 'Friends', 'plus_ones_allowed' => 0],
            ['name' => 'David Kimani', 'email' => 'david@example.com', 'group' => 'Colleagues', 'plus_ones_allowed' => 1],
            ['name' => 'Sarah Nyambura', 'email' => 'sarah@example.com', 'group' => 'Family', 'plus_ones_allowed' => 3],
        ];

        foreach ($guests as $guestData) {
            $guest = Guest::create($guestData);
            Invitation::create([
                'guest_id' => $guest->id,
                'status' => 'pending',
            ]);
        }

        // Create sample gifts
        $gifts = [
            [
                'name' => 'Honeymoon Fund',
                'description' => 'Help us create unforgettable memories on our honeymoon adventure!',
                'category' => 'Experience',
                'is_cash_fund' => true,
                'image_url' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
            ],
            [
                'name' => 'Kitchen Aid Stand Mixer',
                'description' => 'The ultimate kitchen companion for our baking adventures together.',
                'category' => 'Kitchen',
                'price' => 85000,
                'image_url' => 'https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?auto=format&fit=crop&w=400&q=80',
            ],
            [
                'name' => 'Dining Set for 8',
                'description' => 'Beautiful dining set for hosting family and friends in our new home.',
                'category' => 'Home',
                'price' => 120000,
                'image_url' => 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=400&q=80',
            ],
            [
                'name' => 'Luxury Bedding Set',
                'description' => 'Egyptian cotton sheets and duvet for our bedroom sanctuary.',
                'category' => 'Bedroom',
                'price' => 45000,
                'image_url' => 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80',
            ],
            [
                'name' => 'Date Night Fund',
                'description' => 'Contribute to our future date nights and romantic dinners.',
                'category' => 'Experience',
                'is_cash_fund' => true,
                'image_url' => 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80',
            ],
            [
                'name' => 'Coffee Machine',
                'description' => 'For our morning coffee rituals and lazy Sunday mornings.',
                'category' => 'Kitchen',
                'price' => 65000,
                'image_url' => 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80',
            ],
        ];

        foreach ($gifts as $gift) {
            Gift::create($gift);
        }

        $this->command->info('Database seeded successfully!');
        $this->command->info('Admin login: admin@wedding.com / password123');
    }
}
