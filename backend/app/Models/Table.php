<?php

namespace App\Models;

use App\Models\Concerns\RecordsRevisions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    use HasFactory, RecordsRevisions;

    protected string $revisionModule = 'seating';

    protected $fillable = [
        'name', 'capacity', 'x', 'y', 'width', 'height', 'type',
    ];

    public function guests()
    {
        return $this->hasMany(Guest::class);
    }
}
