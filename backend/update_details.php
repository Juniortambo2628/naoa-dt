<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$hero = \App\Models\PageContent::firstOrNew(['section_key' => 'home_hero']);
$data = $hero->content ?? [];
$data['venue'] = ['en' => 'Zereniti House, Limuru, Kenya'];
$data['location'] = 'Zereniti House, Limuru, Kenya';
$hero->content = $data;
$hero->save();

$details = \App\Models\PageContent::firstOrNew(['section_key' => 'event_details']);
$dData = $details->content ?? [];
$dData['time'] = 'TBD';
$details->content = $dData;
$details->save();

echo "Done.\n";
