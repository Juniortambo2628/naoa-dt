<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Table extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'capacity', 'x', 'y', 'width', 'height', 'type'
    ];

    public function guests()
    {
        return $this->hasMany(Guest::class);
    }
}
