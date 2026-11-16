<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A set of gallery photos from one event, e.g. the Ayie or the wedding. */
class GalleryAlbum extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'subtitle', 'event_date', 'order'];

    protected $casts = [
        'event_date' => 'date:Y-m-d',
        'order' => 'integer',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(GalleryItem::class);
    }

    /** Albums in the order things happened. */
    public function scopeChronological($query)
    {
        return $query->orderByRaw('event_date IS NULL')->orderBy('event_date')->orderBy('order')->orderBy('id');
    }
}
