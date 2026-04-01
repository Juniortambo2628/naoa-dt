<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function () {
    $path = public_path('index.html');
    if (file_exists($path)) {
        return file_get_contents($path);
    }
    return view('welcome');
})->where('any', '^(?!api|login|calendar|assets|uploads).*$');

// Named login route for API authentication failures
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');

// Public Calendar Selection Page
Route::get('/calendar', [\App\Http\Controllers\Api\CalendarController::class, 'viewCalendarOptions'])->name('calendar.options');
