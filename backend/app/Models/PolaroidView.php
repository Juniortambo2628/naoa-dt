<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * "Seen by" on a story photo: one row per guest/device per polaroid.
 */
class PolaroidView extends Model
{
    protected $fillable = [
        'polaroid_image_id',
        'guest_name',
        'guest_code',
    ];
}
