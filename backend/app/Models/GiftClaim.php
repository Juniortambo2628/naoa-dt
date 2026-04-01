<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GiftClaim extends Model
{
    use HasFactory;

    protected $fillable = [
        'gift_id',
        'guest_id',
        'claimer_name',
        'claimer_email',
        'amount',
        'message',
        'is_purchased',
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
