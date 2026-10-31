<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A browser/device that turned on guest push notifications. */
class PushSubscription extends Model
{
    protected $fillable = [
        'guest_id', 'endpoint', 'endpoint_hash', 'public_key', 'auth_token', 'content_encoding', 'user_agent',
    ];

    protected $hidden = ['endpoint', 'endpoint_hash', 'public_key', 'auth_token'];

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class);
    }

    public static function hashEndpoint(string $endpoint): string
    {
        return hash('sha256', $endpoint);
    }
}
