<?php

namespace App\Providers;

use App\Models\Revision;
use App\Services\MpesaService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Events\MigrationsEnded;
use Illuminate\Database\Events\MigrationsStarted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
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

        // M-Pesa gifts: guests at the venue share one WiFi IP, so limit per
        // phone number (a few prompts a minute) with a generous per-IP cap.
        RateLimiter::for('mpesa-initiate', fn (Request $request) => [
            Limit::perMinute(4)->by('mpesa-phone:'.(MpesaService::normalizePhone($request->input('phone')) ?? $request->ip())),
            Limit::perMinute(120)->by('mpesa-ip:'.$request->ip()),
        ]);
        // Status checks are polled every few seconds while the guest enters
        // their PIN: limit per payment, not per IP.
        // Reporting a Pay Bill gift / listing your own: per invitation, with a per-IP cap.
        RateLimiter::for('mpesa-report', fn (Request $request) => [
            Limit::perMinute(20)->by('mpesa-report:'.($request->input('guest_code') ?? $request->query('guest_code') ?? $request->ip())),
            Limit::perMinute(600)->by('mpesa-report-ip:'.$request->ip()),
        ]);
        RateLimiter::for('mpesa-status', fn (Request $request) => [
            Limit::perMinute(40)->by('mpesa-status:'.$request->route('publicId')),
            Limit::perMinute(1200)->by('mpesa-status-ip:'.$request->ip()),
        ]);
    }
}
