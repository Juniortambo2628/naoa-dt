<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Web push notifications for guests:
 *   - push_subscriptions: one row per browser/device that turned notifications
 *     on, linked to the guest whose invitation it was opened from (if known)
 *   - push_broadcasts: announcements sent from Admin → Announcements
 *
 * Guest/user references are plain indexed columns (see the collaboration
 * migration for why), and every step checks what already exists so a run
 * that failed half-way on MySQL can simply run again.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('push_subscriptions')) {
            Schema::create('push_subscriptions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('guest_id')->nullable()->index();
                $table->text('endpoint');
                $table->char('endpoint_hash', 64)->unique();
                $table->string('public_key');
                $table->string('auth_token');
                $table->string('content_encoding', 20)->default('aes128gcm');
                $table->string('user_agent')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('push_broadcasts')) {
            Schema::create('push_broadcasts', function (Blueprint $table) {
                $table->id();
                $table->string('title', 100);
                $table->string('body', 500);
                $table->string('url')->nullable();
                $table->string('audience', 20)->default('all'); // all | confirmed
                $table->string('status', 20)->default('queued'); // queued | sent | failed
                $table->unsignedInteger('sent_count')->default(0);
                $table->unsignedInteger('failed_count')->default(0);
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('push_broadcasts');
        Schema::dropIfExists('push_subscriptions');
    }
};
