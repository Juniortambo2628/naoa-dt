<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PolaroidImage extends Model
{
    use HasFactory;

    protected $fillable = ['image_path', 'note', 'custom_size', 'offset_x', 'offset_y', 'rotation', 'location'];

    protected $appends = ['full_image_url'];

    public function getFullImageUrlAttribute()
    {
        return asset($this->image_path);
    }

    //
}
