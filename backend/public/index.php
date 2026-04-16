<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

/*
|--------------------------------------------------------------------------
| Dynamic Path Resolution
|--------------------------------------------------------------------------
| This logic allows the application to run both locally (in WAMP) and in
| a split-directory production environment (cPanel) where core files
| are located in /home/zhpebukm/naoa-core.
*/

$productionPath = __DIR__ . '/../../../naoa-core'; // Path from /api/public root up to /home/zhpebukm/naoa-core
$localPath = __DIR__ . '/..';

if (file_exists($productionPath . '/vendor/autoload.php')) {
    $basePath = $productionPath;
} else {
    $basePath = $localPath;
}

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = $basePath . '/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require $basePath . '/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once $basePath . '/bootstrap/app.php';

// Override public_path() to always point to the ACTUAL document root.
// On production, Laravel's default would resolve to naoa-core/public/,
// but the web server serves from dnt-wed.okjtech.co.ke/api/public/.
// Using __DIR__ ensures uploads go to the same place the web server reads from.
$app->usePublicPath(__DIR__);

$app->handleRequest(Request::capture());

