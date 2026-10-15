<?php

namespace App\Providers;

use App\Models\Revision;
use Illuminate\Database\Events\MigrationsEnded;
use Illuminate\Database\Events\MigrationsStarted;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Schema::defaultStringLength(191);

        // Data migrations (and backup verification, which migrates a scratch
        // database) aren't edits anyone made: keep them out of version history.
        Event::listen(MigrationsStarted::class, fn () => Revision::pause());
        Event::listen(MigrationsEnded::class, fn () => Revision::resume());
    }
}
