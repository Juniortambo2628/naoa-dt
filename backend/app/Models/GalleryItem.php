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
        'gallery_album_id',
        'thumb_url',
        'taken_at',
        'original_name',
        'width',
        'height',
        'is_featured',
    ];

    protected $casts = [
        'is_visible' => 'boolean',
        'is_guest_upload' => 'boolean',
        'order' => 'integer',
        'is_featured' => 'boolean',
        'gallery_album_id' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'taken_at' => 'datetime',
    ];

    public function album(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(GalleryAlbum::class, 'gallery_album_id');
    }
}
