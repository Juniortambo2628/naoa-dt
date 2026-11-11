<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * M-Pesa STK Push ("Lipa Na M-Pesa Online") cash gifts.
 *
 * One row per payment prompt sent to a guest's phone. The row is written
 * before Safaricom is called, so every prompt is accounted for even if the
 * confirmation callback never arrives (the reconcile command then asks
 * Safaricom for the result).
 *
 * Concurrency guards live in the schema:
 * - `public_id` is what the browser polls with (never the numeric id).
 * - `idempotency_key` is unique: a double-tapped "Send" creates one prompt.
 * - `checkout_request_id` / `mpesa_receipt` are unique: a repeated callback
 *   can never record the same payment twice.
 *
 * A run that failed half-way on MySQL (table created, a later step not)
 * can simply run again: each step checks what already exists.
 *
 * `gift_claims` gains `payment_method` / `payment_reference` so a confirmed
 * M-Pesa gift shows up in the existing gift registry with its receipt number.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('mpesa_payments')) {
            Schema::create('mpesa_payments', function (Blueprint $table) {
                $table->id();
                $table->uuid('public_id')->unique();
                $table->string('idempotency_key', 64)->unique();

                // Who gave: the invite it came from, and the name to thank.
                // Plain indexed ids, not foreign-key constraints: the MySQL
                // hosts reject them (errno 150), as the push migration notes.
                $table->unsignedBigInteger('guest_id')->nullable()->index();
                $table->unsignedBigInteger('gift_id')->nullable()->index();
                $table->string('giver_name', 255);
                $table->boolean('on_behalf')->default(false);
                $table->string('message', 500)->nullable();

                $table->string('phone', 20)->index();
                $table->unsignedInteger('amount');
                $table->string('account_reference', 20);

                // pending -> success | failed | cancelled | timeout
                $table->string('status', 20)->default('pending')->index();
                $table->string('merchant_request_id', 100)->nullable();
                $table->string('checkout_request_id', 100)->nullable()->unique();
                $table->string('result_code', 20)->nullable();
                $table->string('result_desc', 255)->nullable();
                $table->string('mpesa_receipt', 30)->nullable()->unique();
                $table->string('paid_phone', 20)->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->unsignedBigInteger('gift_claim_id')->nullable()->index();
                $table->json('raw_callback')->nullable();
                $table->timestamp('last_queried_at')->nullable();
                $table->timestamps();
            });
        }

        Schema::table('gift_claims', function (Blueprint $table) {
            if (! Schema::hasColumn('gift_claims', 'payment_method')) {
                $table->string('payment_method', 20)->nullable()->after('is_purchased');
            }
            if (! Schema::hasColumn('gift_claims', 'payment_reference')) {
                $table->string('payment_reference', 30)->nullable()->after('payment_method');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mpesa_payments');

        Schema::table('gift_claims', function (Blueprint $table) {
            foreach (['payment_reference', 'payment_method'] as $column) {
                if (Schema::hasColumn('gift_claims', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
