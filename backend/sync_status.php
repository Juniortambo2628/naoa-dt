<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Guest;
use App\Models\RsvpResponse;

echo "Syncing RSVP statuses and plus ones to guests table...\n";

Guest::chunk(100, function ($guests) {
    foreach ($guests as $guest) {
        $res = RsvpResponse::where('guest_id', $guest->id)->first();
        if ($res) {
            $status = $res->attending ? 'confirmed' : 'declined';
            $guest->update([
                'rsvp_status' => $status,
                'confirmed_plus_ones' => $res->plus_ones_count ?? 0
            ]);
            echo "Guest {$guest->name}: {$status} ({$guest->confirmed_plus_ones} plus ones)\n";
        } else {
            $guest->update([
                'rsvp_status' => 'pending',
                'confirmed_plus_ones' => 0
            ]);
        }
    }
});

echo "Success!\n";
