<?php

namespace App\Models;

use App\Models\Concerns\RecordsRevisions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enquiry extends Model
{
    use HasFactory, RecordsRevisions;

    protected string $revisionModule = 'enquiries';

    protected $fillable = [
        'name',
        'email',
        'type',
        'subject',
        'message',
        'reply_message',
        'replied_at',
        'status',
    ];

    protected $casts = [
        'replied_at' => 'datetime',
    ];
}
