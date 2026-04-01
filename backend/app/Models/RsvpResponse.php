<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RsvpResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'guest_id',
        'attending',
        'plus_ones_count',
        'dietary_notes',
        'message',
    ];

    protected $casts = [
        'attending' => 'boolean',
        'plus_ones_count' => 'integer',
    ];

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class);
    }
}
