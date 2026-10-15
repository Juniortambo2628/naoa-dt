<?php

namespace App\Models;

use App\Models\Concerns\RecordsRevisions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PolaroidImage extends Model
{
    use HasFactory, RecordsRevisions;

    protected string $revisionModule = 'gallery';

    protected $fillable = ['image_path', 'title', 'caption', 'note', 'custom_size', 'offset_x', 'offset_y', 'rotation', 'location', 'taken_at'];

    protected $appends = ['full_image_url'];

    public function getFullImageUrlAttribute()
    {
        return asset($this->image_path);
    }

    //
}
