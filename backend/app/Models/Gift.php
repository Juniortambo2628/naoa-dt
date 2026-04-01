<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Gift extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'image_url',
        'product_link',
        'category',
        'is_cash_fund',
        'is_available',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_cash_fund' => 'boolean',
        'is_available' => 'boolean',
    ];

    protected $appends = ['claimed', 'total_contributions'];

    public function claims(): HasMany
    {
        return $this->hasMany(GiftClaim::class);
    }

    public function getClaimedAttribute(): bool
    {
        // For non-cash funds, check if there's any claim
        if (!$this->is_cash_fund) {
            return $this->claims()->exists();
        }
        return false; // Cash funds are never "claimed"
    }

    public function getTotalContributionsAttribute(): float
    {
        if ($this->is_cash_fund) {
            return $this->claims()->sum('amount') ?? 0;
        }
        return 0;
    }
}
