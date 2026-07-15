<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class Guest extends Model
{
    use HasFactory, Notifiable, SoftDeletes;

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
        'rsvp_status',
        'rsvp_message',
        'dietary_notes',
        'parent_guest_id',
        'save_the_date_method',
        'invitation_via',
    ];

    protected $casts = [
        'checked_in_at' => 'datetime',
    ];

    // --- Query Scopes ---

    public function scopeConfirmed(Builder $query): Builder
    {
        return $query->where('rsvp_status', 'confirmed');
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('rsvp_status', 'pending');
    }

    public function scopeDeclined(Builder $query): Builder
    {
        return $query->where('rsvp_status', 'declined');
    }

    public function scopePrimary(Builder $query): Builder
    {
        return $query->whereNull('parent_guest_id');
    }

    public function scopeCheckedIn(Builder $query): Builder
    {
        return $query->whereNotNull('checked_in_at');
    }

    // --- Relationships ---

    public function parentGuest(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Guest::class, 'parent_guest_id');
    }

    public function plusOnes(): HasMany
    {
        return $this->hasMany(Guest::class, 'parent_guest_id');
    }

    public function table(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    public function invitation(): HasOne
    {
        return $this->hasOne(Invitation::class);
    }

    public function giftClaims(): HasMany
    {
        return $this->hasMany(GiftClaim::class);
    }

    // --- Helper Methods ---

    public function hasResponded(): bool
    {
        return $this->rsvp_status !== 'pending';
    }

    public function isAttending(): bool
    {
        return $this->rsvp_status === 'confirmed';
    }

    public function createPendingInvitation(): Invitation
    {
        return $this->invitation ?? Invitation::create([
            'guest_id' => $this->id,
            'status'   => 'pending',
            'token'    => Str::random(32),
        ]);
    }

    // --- Boot ---

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
}
