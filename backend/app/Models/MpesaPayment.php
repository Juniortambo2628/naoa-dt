<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * One M-Pesa STK Push prompt sent to a guest's phone for a cash gift.
 * See the create_mpesa_payments_table migration for the concurrency guards.
 */
class MpesaPayment extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_SUCCESS = 'success';

    public const STATUS_FAILED = 'failed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_TIMEOUT = 'timeout';

    /** A gift the guest sent from their own M-Pesa menu and told us about (amount + M-Pesa code). */
    public const STATUS_REPORTED = 'reported';

    /** How the gift was sent: a prompt to the guest's phone, or Pay Bill from their M-Pesa menu. */
    public const METHOD_STK = 'stk';

    public const METHOD_PAYBILL = 'paybill';

    /** Daraja result codes that mean the guest dismissed or ignored the prompt. */
    public const CANCELLED_CODES = ['1032'];

    public const TIMEOUT_CODES = ['1037', '1019'];

    /** Defaults present on a new model in memory, not only in the database. */
    protected $attributes = [
        'status' => self::STATUS_PENDING,
        'method' => self::METHOD_STK,
        'on_behalf' => false,
    ];

    protected $fillable = [
        'public_id',
        'idempotency_key',
        'guest_id',
        'gift_id',
        'giver_name',
        'on_behalf',
        'message',
        'phone',
        'amount',
        'account_reference',
        'status',
        'method',
        'merchant_request_id',
        'checkout_request_id',
        'result_code',
        'result_desc',
        'mpesa_receipt',
        'paid_phone',
        'paid_at',
        'gift_claim_id',
        'raw_callback',
        'last_queried_at',
    ];

    protected $casts = [
        'on_behalf' => 'boolean',
        'amount' => 'integer',
        'raw_callback' => 'array',
        'paid_at' => 'datetime',
        'last_queried_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (MpesaPayment $payment) {
            $payment->public_id ??= (string) Str::uuid();
        });
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class);
    }

    public function gift(): BelongsTo
    {
        return $this->belongsTo(Gift::class);
    }

    public function giftClaim(): BelongsTo
    {
        return $this->belongsTo(GiftClaim::class);
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /** Map a Daraja ResultCode to our status. */
    public static function statusForResultCode(string|int $code): string
    {
        $code = (string) $code;

        return match (true) {
            $code === '0' => self::STATUS_SUCCESS,
            in_array($code, self::CANCELLED_CODES, true) => self::STATUS_CANCELLED,
            in_array($code, self::TIMEOUT_CODES, true) => self::STATUS_TIMEOUT,
            default => self::STATUS_FAILED,
        };
    }

    /**
     * What the guest's browser may see while it waits: no phone numbers or
     * internal ids, just enough to show progress and say thank you.
     */
    public function toPublicArray(): array
    {
        return [
            'id' => $this->public_id,
            'status' => $this->status,
            'amount' => $this->amount,
            'giver_name' => $this->giver_name,
            'receipt' => $this->status === self::STATUS_SUCCESS ? $this->mpesa_receipt : null,
            'message' => self::guestMessage($this->status, $this->result_code),
        ];
    }

    /**
     * One gift as its own giver sees it on their invitation (never anyone
     * else's): amount, how it was sent, the M-Pesa code and when.
     */
    public function toGiverArray(): array
    {
        return [
            'id' => $this->public_id,
            'amount' => $this->amount,
            'status' => $this->status,
            'method' => $this->method,
            'giver_name' => $this->giver_name,
            'receipt' => $this->mpesa_receipt,
            'created_at' => $this->created_at,
        ];
    }

    /** Plain-language explanation for each outcome (shown to non-technical guests). */
    public static function guestMessage(string $status, ?string $resultCode): string
    {
        return match ($status) {
            self::STATUS_PENDING => 'Check your phone and enter your M-Pesa PIN to complete the gift.',
            self::STATUS_SUCCESS => 'Thank you! Your gift has been received.',
            self::STATUS_CANCELLED => 'The M-Pesa request was cancelled on the phone. No money was taken.',
            self::STATUS_TIMEOUT => 'We did not get a response from the phone in time. No money was taken.',
            default => match ((string) $resultCode) {
                '1' => 'The M-Pesa balance was not enough for this gift. No money was taken.',
                '2001' => 'The M-Pesa PIN was not accepted. No money was taken — please try again.',
                default => 'The payment did not go through. No money was taken — please try again.',
            },
        };
    }
}
