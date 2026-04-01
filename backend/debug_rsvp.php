<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Guest;
use App\Models\RsvpResponse;

echo "--- GUESTS ---\n";
$guests = Guest::all();
foreach ($guests as $guest) {
    print_r($guest->toArray());
}

echo "\n--- RSVP RESPONSES ---\n";
$responses = RsvpResponse::all();
foreach ($responses as $res) {
    print_r($res->toArray());
}
