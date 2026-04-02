<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Using updateOrCreate to prevent duplicate admin accounts
        User::updateOrCreate(
            ['email' => 'tangtzeren@gmail.com'],
            [
                'name' => 'Tze Ren Tang',
                'password' => Hash::make('password'),
            ]
        );
    }
}
