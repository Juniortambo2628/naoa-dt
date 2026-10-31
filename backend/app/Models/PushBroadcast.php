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

    /**
     * Where tapping the notification takes a guest. "invite" (the default) is
     * the guest's own digital invitation, optionally at a section
     * ("invite#programme"); anything else is a site path or https link.
     * Devices not linked to a guest go to /rsvp, which reopens the
     * invitation remembered on that device.
     */
    public function urlFor(?Guest $guest): string
    {
        $url = $this->url ?: 'invite';
        if (! str_starts_with($url, 'invite')) {
            return $url;
        }

        $hash = str_contains($url, '#') ? '#'.substr($url, strpos($url, '#') + 1) : '';

        return $guest?->unique_code
            ? '/invitation/'.rawurlencode($guest->unique_code).$hash
            : '/rsvp';
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
