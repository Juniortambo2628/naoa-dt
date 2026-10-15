<?php

namespace App\Models;

use App\Models\Concerns\RecordsRevisions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PageContent extends Model
{
    use HasFactory, RecordsRevisions;

    protected $fillable = ['section_key', 'content', 'is_visible'];

    protected $casts = [
        'content' => 'array',
        'is_visible' => 'boolean',
    ];

    /** Switching a section on/off happens on the Modules page; the rest is CMS. */
    public function revisionModule(array $changed = []): string
    {
        return $changed === ['is_visible'] ? 'modules' : 'content';
    }
}
