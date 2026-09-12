<?php

namespace Database\Seeders;

use App\Models\EmergencyNumber;
use Illuminate\Database\Seeder;

class EmergencyNumberSeeder extends Seeder
{
    public function run(): void
    {
        $emergencyNumbers = [
            // General Emergency
            [
                'name' => 'Emergency (All Services)',
                'number' => '999',
                'description' => 'Universal emergency number - Police, Ambulance, Fire',
                'category' => 'general',
                'icon' => 'phone',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Emergency (Mobile)',
                'number' => '112',
                'description' => 'Works on any mobile phone',
                'category' => 'general',
                'icon' => 'smartphone',
                'sort_order' => 2,
                'is_active' => true,
            ],

            // Police
            [
                'name' => 'Police',
                'number' => '999',
                'description' => 'Kenya Police',
                'category' => 'police',
                'icon' => 'shield',
                'sort_order' => 10,
                'is_active' => true,
            ],
            [
                'name' => 'Police Control Room',
                'number' => '020 2724154',
                'description' => 'Nairobi Police Control Room',
                'category' => 'police',
                'icon' => 'building',
                'sort_order' => 11,
                'is_active' => true,
            ],
            [
                'name' => 'Police Headquarters',
                'number' => '020 240000',
                'description' => 'Kenya Police Headquarters',
                'category' => 'police',
                'icon' => 'building',
                'sort_order' => 12,
                'is_active' => true,
            ],

            // Medical / Ambulance
            [
                'name' => 'Ambulance',
                'number' => '999',
                'description' => 'General ambulance service',
                'category' => 'medical',
                'icon' => 'heart',
                'sort_order' => 20,
                'is_active' => true,
            ],
            [
                'name' => 'Kenya Red Cross',
                'number' => '0700 395 395',
                'description' => 'Emergency medical services nationwide',
                'category' => 'medical',
                'icon' => 'heart',
                'sort_order' => 21,
                'is_active' => true,
            ],
            [
                'name' => 'Kenyatta National Hospital',
                'number' => '020 2726300',
                'description' => '24-hour emergency services',
                'category' => 'medical',
                'icon' => 'hospital',
                'sort_order' => 22,
                'is_active' => true,
            ],
            [
                'name' => 'AAR Health Emergency',
                'number' => '0738 606 409',
                'description' => '24-hour ambulance service',
                'category' => 'medical',
                'icon' => 'heart',
                'sort_order' => 23,
                'is_active' => true,
            ],
            [
                'name' => 'St John Ambulance',
                'number' => '0721 225 416',
                'description' => 'Emergency medical evacuation',
                'category' => 'medical',
                'icon' => 'heart',
                'sort_order' => 24,
                'is_active' => true,
            ],

            // Fire
            [
                'name' => 'Fire Brigade',
                'number' => '020 2222181',
                'description' => 'Nairobi Fire Brigade Headquarters',
                'category' => 'fire',
                'icon' => 'flame',
                'sort_order' => 30,
                'is_active' => true,
            ],
            [
                'name' => 'Fire Emergency (Toll Free)',
                'number' => '1508',
                'description' => 'Toll-free fire emergency line',
                'category' => 'fire',
                'icon' => 'flame',
                'sort_order' => 31,
                'is_active' => true,
            ],

            // Tourism / Travel
            [
                'name' => 'Tourism Helpline',
                'number' => '020 2717566',
                'description' => 'Kenya Tourism Federation Safety Center',
                'category' => 'tourism',
                'icon' => 'map',
                'sort_order' => 40,
                'is_active' => true,
            ],

            // Support
            [
                'name' => 'Gender Violence',
                'number' => '1195',
                'description' => 'Gender Violence Recovery Centre',
                'category' => 'support',
                'icon' => 'heart-handshake',
                'sort_order' => 50,
                'is_active' => true,
            ],
            [
                'name' => 'Child Helpline',
                'number' => '116',
                'description' => 'Childline Kenya',
                'category' => 'support',
                'icon' => 'baby',
                'sort_order' => 51,
                'is_active' => true,
            ],
            [
                'name' => 'FIDA Kenya',
                'number' => '020 2715880',
                'description' => 'Federation of Women Lawyers',
                'category' => 'support',
                'icon' => 'scale',
                'sort_order' => 52,
                'is_active' => true,
            ],
        ];

        foreach ($emergencyNumbers as $number) {
            EmergencyNumber::create($number);
        }
    }
}
