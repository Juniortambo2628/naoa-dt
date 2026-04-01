<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SongRequest extends Model
{
    protected $fillable = [
        'guest_name',
        'song_data',
        'song_title',
        'artist',
        'is_played',
        'played_at',
    ];

    protected $casts = [
        'song_data' => 'array',
        'is_played' => 'boolean',
        'played_at' => 'datetime',
    ];
}
