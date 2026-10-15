<?php

namespace App\Models;

use App\Models\Concerns\RecordsRevisions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GuestbookEntry extends Model
{
    use HasFactory, RecordsRevisions;

    protected string $revisionModule = 'guestbook';

    protected $fillable = [
        'guest_name',
        'message',
        'is_approved',
    ];

    protected $casts = [
        'is_approved' => 'boolean',
    ];
}
