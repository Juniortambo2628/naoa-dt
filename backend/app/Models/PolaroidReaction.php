<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * An emoji tap on a story post. One row per guest/device per polaroid —
 * see the migration for the uniqueness rule.
 */
class PolaroidReaction extends Model
{
    protected $fillable = [
        'polaroid_image_id',
        'emoji',
        'guest_name',
        'guest_code',
    ];
}
