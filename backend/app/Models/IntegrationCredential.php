<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Encrypted credentials for an outside service, entered by an owner in the
 * admin. Deliberately not revision-tracked and never serialised to the
 * browser: `payload` is hidden and encrypted at rest with APP_KEY.
 */
class IntegrationCredential extends Model
{
    protected $fillable = ['name', 'payload', 'updated_by'];

    protected $hidden = ['payload'];

    protected $casts = [
        'payload' => 'encrypted:array',
    ];

    public static function payloadFor(string $name): array
    {
        return static::where('name', $name)->first()?->payload ?? [];
    }
}
