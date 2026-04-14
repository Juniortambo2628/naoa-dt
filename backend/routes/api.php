<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GuestController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\GiftController;
use App\Http\Controllers\Api\TwoFactorController;
use App\Http\Controllers\Api\GalleryController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\PageContentController;
use App\Http\Controllers\Api\FaqController;
use App\Http\Controllers\Api\SpotifyController;
use App\Http\Controllers\Api\SongRequestController;
use App\Http\Controllers\Api\GuestbookController;
use App\Http\Controllers\Api\ScheduleController as ApiScheduleController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\TranslateController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\CheckInController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TestController;
use App\Http\Controllers\PolaroidImageController;
use App\Http\Controllers\Api\CalendarController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Temporary Storage Link Route
Route::get('/create-storage-link', function () {
    try {
        if (file_exists(public_path('storage'))) {
            return response()->json(['message' => 'The "public/storage" directory already exists.']);
        }
        
        // Manual symlink creation
        $target = storage_path('app/public');
        $shortcut = public_path('storage');
        
        if (symlink($target, $shortcut)) {
            return response()->json(['message' => 'Storage link created successfully.']);
        }
        
        return response()->json(['message' => 'Failed to create storage link using symlink().'], 500);
    } catch (\Exception $e) {
        return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
    }
});

// Public Authentication Routes (Throttled)
Route::middleware('throttle:15,1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/verify-2fa', [AuthController::class, 'verify2fa']);
});

// Public Guest Routes (for RSVP - Throttled)
Route::middleware('throttle:30,1')->group(function () {
    Route::group(['prefix' => 'guests'], function () {
        Route::get('/code/{code}', [GuestController::class, 'getByCode']);
        Route::post('/code/{code}/rsvp', [GuestController::class, 'submitRsvp']);
    });
});

// Public Informational Routes (Throttled)
Route::middleware('throttle:60,1')->group(function () {
    // Public Schedule Routes
    Route::group(['prefix' => 'schedule'], function () {
        Route::get('/', [ScheduleController::class, 'getSchedule']);
        Route::get('/updates', [ScheduleController::class, 'getLiveUpdates']);
    });
    
    // Public Content Routes
    Route::group(['prefix' => 'content'], function () {
        Route::get('/', [PageContentController::class, 'index']);
        Route::get('/{key}', [PageContentController::class, 'show']);
    });

    // Public FAQ Routes
    Route::get('/faqs', [FaqController::class, 'index']);
});

// Public Transactional Routes (Throttled)
Route::middleware('throttle:30,1')->group(function () {
    // Public Gallery Routes
    Route::group(['prefix' => 'gallery'], function () {
        Route::get('/', [GalleryController::class, 'index']);
        Route::post('/guest-upload', [GalleryController::class, 'guestUpload']);
    });

    // Public Gift Routes
    Route::group(['prefix' => 'gifts'], function () {
        Route::get('/', [GiftController::class, 'index']);
        Route::post('/{gift}/claim', [GiftController::class, 'claim']);
    });

    // Public Spotify Search (for RSVP song requests)
    Route::group(['prefix' => 'spotify'], function () {
        Route::get('/search', [SpotifyController::class, 'search']);
        Route::get('/track/{trackId}', [SpotifyController::class, 'getTrack']);
    });

    // Public Song Requests
    Route::group(['prefix' => 'song-requests'], function () {
        Route::get('/', [SongRequestController::class, 'index']);
        Route::post('/', [SongRequestController::class, 'store']);
    });

    // Public Guestbook / Well Wishes
    Route::group(['prefix' => 'guestbook'], function () {
        Route::get('/', [GuestbookController::class, 'index']);
        Route::post('/', [GuestbookController::class, 'store']);
    });
});

// Full Schedule for Public Programme (Events + Items)
Route::get('/schedule/full', [ApiScheduleController::class, 'index']);

// Public Polaroid Images
Route::get('/polaroid-images', [PolaroidImageController::class, 'index']);

// Public Calendar Routes
Route::get('/calendar/ics', [CalendarController::class, 'downloadIcs'])->name('calendar.ics');

// Protected Routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Guest Management (admin)
    Route::group(['prefix' => 'guests'], function () {
        Route::get('/', [GuestController::class, 'index']);
        Route::get('/statistics', [GuestController::class, 'statistics']);
        Route::get('/export', [GuestController::class, 'export']);
        Route::post('/import', [GuestController::class, 'import']);
        Route::post('/validate-import', [GuestController::class, 'validateImport']);
        Route::post('/import-confirm', [GuestController::class, 'importConfirm']);
        Route::post('/bulk-update', [GuestController::class, 'bulkUpdate']);
        Route::post('/', [GuestController::class, 'store']);
        Route::put('/{guest}', [GuestController::class, 'update']);
        Route::delete('/{guest}', [GuestController::class, 'destroy']);
        Route::post('/{guest}/whatsapp-invite', [GuestController::class, 'markWhatsappSent']);
    });

    // Invitation Management (admin)
    Route::group(['prefix' => 'invitations'], function () {
        Route::post('/{guest}/send', [InvitationController::class, 'send']);
        Route::post('/send-bulk', [\App\Http\Controllers\Api\InvitationController::class, 'sendBulk']);
        Route::post('/{guest}/resend', [\App\Http\Controllers\Api\InvitationController::class, 'resend']);
    });

    // Schedule Management (admin)
    Route::group(['prefix' => 'schedule'], function () {
        Route::get('/events', [ScheduleController::class, 'index']);
        Route::post('/events', [ScheduleController::class, 'storeEvent']);
        Route::put('/events/{event}', [ScheduleController::class, 'updateEvent']);
        Route::delete('/events/{event}', [ScheduleController::class, 'destroyEvent']);
        Route::post('/events/{event}/items', [ScheduleController::class, 'storeScheduleItem']);
        Route::put('/items/{scheduleItem}', [ScheduleController::class, 'updateItem']);
        Route::delete('/items/{scheduleItem}', [ScheduleController::class, 'destroyItem']);
        Route::post('/updates', [ScheduleController::class, 'postUpdate']);
    });

    // Gift Management (admin)
    Route::group(['prefix' => 'gifts'], function () {
        Route::get('/statistics', [GiftController::class, 'statistics']);
        Route::post('/', [GiftController::class, 'store']);
        Route::put('/{gift}', [GiftController::class, 'update']);
        Route::delete('/{gift}', [GiftController::class, 'destroy']);
    });

    // Table Management (admin)
    Route::group(['prefix' => 'tables'], function () {
        Route::get('/', [TableController::class, 'index']);
        Route::post('/', [TableController::class, 'store']);
        Route::put('/{table}', [TableController::class, 'update']);
        Route::delete('/{table}', [TableController::class, 'destroy']);
        Route::post('/{table}/assign', [TableController::class, 'assignGuest']);
        Route::post('/guests/{guest}/unassign', [TableController::class, 'unassignGuest']);
    });

    // Gallery Management (admin)
    Route::group(['prefix' => 'gallery'], function () {
        Route::post('/', [GalleryController::class, 'store']);
        Route::post('/reorder', [GalleryController::class, 'reorder']);
        Route::put('/{galleryItem}', [GalleryController::class, 'update']);
        Route::delete('/{galleryItem}', [GalleryController::class, 'destroy']);
    });

    // CMS / Page Content (admin)
    Route::group(['prefix' => 'content'], function () {
        Route::post('/{key}', [PageContentController::class, 'update']);
    });

    // FAQ Management (admin)
    Route::group(['prefix' => 'faqs'], function () {
        Route::post('/', [FaqController::class, 'store']);
        Route::post('/reorder', [FaqController::class, 'reorder']);
        Route::put('/{faq}', [FaqController::class, 'update']);
        Route::delete('/{faq}', [FaqController::class, 'destroy']);
    });
    
    // Media Upload
    Route::post('/upload', [MediaController::class, 'upload']);

    // Settings Management (admin)
    Route::get('/settings', [SettingController::class, 'index']);
    Route::post('/settings', [SettingController::class, 'update']);
    
    // Polaroid Images (Admin)
    Route::post('/polaroid-images', [PolaroidImageController::class, 'store']);
    Route::match(['put', 'patch'], '/polaroid-images/{id}', [PolaroidImageController::class, 'update']);
    Route::delete('/polaroid-images/{id}', [PolaroidImageController::class, 'destroy']);

    // Auto-Translation Support
    Route::post('/translate', [TranslateController::class, 'translate']);

    // Analytics
    Route::get('/analytics', [AnalyticsController::class, 'getStats']);

    // Exports
    Route::get('/export/guests', [ExportController::class, 'exportGuestsExcel']);
    Route::get('/export/vendor-pdf', [ExportController::class, 'exportVendorPdf']);

    // QR Check-in
    Route::group(['prefix' => 'checkin'], function () {
        Route::post('/guests/{guest}/generate-qr', [CheckInController::class, 'generateQR']);
        Route::post('/scan', [CheckInController::class, 'checkIn']);
        Route::get('/stats', [CheckInController::class, 'getStats']);
    });

    // Song Requests (Admin Management)
    Route::group(['prefix' => 'song-requests-admin'], function () {
        Route::patch('/{songRequest}/played', [SongRequestController::class, 'markPlayed']);
        Route::delete('/{songRequest}', [SongRequestController::class, 'destroy']);
    });

    // Guestbook (Admin Management)
    Route::group(['prefix' => 'guestbook-admin'], function () {
        Route::patch('/{guestbookEntry}/approve', [GuestbookController::class, 'approve']);
        Route::delete('/{guestbookEntry}', [GuestbookController::class, 'destroy']);
    });

    // 2FA Routes
    Route::post('/2fa/setup', [TwoFactorController::class, 'setup']);
    Route::post('/2fa/confirm', [TwoFactorController::class, 'confirm']);
    Route::post('/2fa/disable', [TwoFactorController::class, 'disable']);

    // Notification Routes (admin)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/mark-read', [NotificationController::class, 'markAllRead']);

    // Test Routes (Admin)
    Route::post('/test/email', [TestController::class, 'sendTestEmail']);
});

