<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Enquiry extends Model
{
    protected $fillable = [
        'name',
        'email',
        'type',
        'subject',
        'message',
        'reply_message',
        'replied_at',
        'status'
    ];

    protected $casts = [
        'replied_at' => 'datetime',
    ];
}
