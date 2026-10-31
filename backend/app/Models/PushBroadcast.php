<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** An announcement pushed to guests' devices from Admin → Announcements. */
class PushBroadcast extends Model
{
    public const AUDIENCES = ['all', 'confirmed'];

    protected $fillable = [
        'title', 'body', 'url', 'audience', 'status', 'sent_count', 'failed_count', 'user_id', 'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'sent_count' => 'integer',
        'failed_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** The subscriptions this broadcast goes to. */
    public function recipients(): Builder
    {
        $query = PushSubscription::query();

        if ($this->audience === 'confirmed') {
            $query->whereHas('guest', fn ($q) => $q->where('rsvp_status', 'confirmed'));
        }

        return $query;
    }
}
