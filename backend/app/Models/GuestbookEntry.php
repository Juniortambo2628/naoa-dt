<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GuestbookEntry extends Model
{
    protected $fillable = [
        'guest_name',
        'message',
        'is_approved',
    ];

    protected $casts = [
        'is_approved' => 'boolean',
    ];
}
