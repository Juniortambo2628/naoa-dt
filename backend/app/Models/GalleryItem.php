<?php

namespace App\Models;

use App\Models\Concerns\RecordsRevisions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GalleryItem extends Model
{
    use HasFactory, RecordsRevisions;

    protected string $revisionModule = 'gallery';

    protected $fillable = [
        'image_url',
        'caption',
        'order',
        'is_visible',
        'object_position',
        'uploaded_by',
        'is_guest_upload',
    ];

    protected $casts = [
        'is_visible' => 'boolean',
        'is_guest_upload' => 'boolean',
        'order' => 'integer',
    ];
}
