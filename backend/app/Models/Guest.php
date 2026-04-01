<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class Guest extends Model
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'group',
        'plus_ones_allowed',
        'unique_code',
        'table_id',
        'song_request',
        'qr_code',
        'checked_in_at',
        'dietary_preference',
        'rsvp_status',
        'confirmed_plus_ones',
        'notes',
        'parent_guest_id',
        'save_the_date_method',
        'invitation_via',
    ];

    protected $casts = [
        'checked_in_at' => 'datetime',
    ];

    /**
     * Get the primary guest this plus-one belongs to.
     */
    public function parentGuest(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Guest::class, 'parent_guest_id');
    }

    /**
     * Get the plus-ones for this guest.
     */
    public function plusOnes(): HasMany
    {
        return $this->hasMany(Guest::class, 'parent_guest_id');
    }

    public function table(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($guest) {
            if (empty($guest->unique_code)) {
                $guest->unique_code = self::generateUniqueCode();
            }
        });
    }

    public static function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (self::where('unique_code', $code)->exists());
        
        return $code;
    }

    public function rsvpResponse(): HasOne
    {
        return $this->hasOne(RsvpResponse::class);
    }

    public function invitation(): HasOne
    {
        return $this->hasOne(Invitation::class);
    }

    public function giftClaims(): HasMany
    {
        return $this->hasMany(GiftClaim::class);
    }

    public function hasResponded(): bool
    {
        return $this->rsvpResponse !== null;
    }

    public function isAttending(): bool
    {
        return $this->rsvpResponse?->attending ?? false;
    }
}
