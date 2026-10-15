<?php

namespace App\Models;

use App\Models\Concerns\RecordsRevisions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SongRequest extends Model
{
    use HasFactory, RecordsRevisions;

    protected string $revisionModule = 'songs';

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
