<?php

namespace App\Models;

use App\Models\Concerns\RecordsRevisions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GiftClaim extends Model
{
    use HasFactory, RecordsRevisions;

    protected string $revisionModule = 'gifts';

    protected $fillable = [
        'gift_id',
        'guest_id',
        'claimer_name',
        'claimer_email',
        'amount',
        'message',
        'is_purchased',
        'payment_method',    // 'mpesa' when paid by STK Push from the invitation
        'payment_reference', // M-Pesa receipt number
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_purchased' => 'boolean',
    ];

    public function gift(): BelongsTo
    {
        return $this->belongsTo(Gift::class);
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class);
    }
}
