<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScheduleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'title',
        'start_time',
        'end_time',
        'description',
        'location',
        'type',
        'status',
        'order',
    ];

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function liveUpdates(): HasMany
    {
        return $this->hasMany(LiveUpdate::class)->latest();
    }
}
