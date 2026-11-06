<?php

namespace App\Models;

use App\Models\Concerns\RecordsRevisions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PolaroidImage extends Model
{
    use HasFactory, RecordsRevisions;

    protected string $revisionModule = 'gallery';

    protected $fillable = [
        'image_path',
        'title',
        'caption',
        'note',
        'custom_size',
        'offset_x',
        'offset_y',
        'rotation',
        'location',
        'taken_at',
        'guest_name',
        'guest_code',
    ];

    protected $appends = ['full_image_url'];

    /** Never serialise the device id: it is used server-side only. */
    protected $hidden = ['guest_code'];

    public function getFullImageUrlAttribute()
    {
        return asset($this->image_path);
    }

    public function reactions()
    {
        return $this->hasMany(PolaroidReaction::class);
    }

    public function views()
    {
        return $this->hasMany(PolaroidView::class);
    }

    /**
     * What a story needs to render reactions: total, per-emoji counts (most
     * popular first) and this viewer's own tap so the button shows as active.
     *
     * @param  ?string  $viewerCode  the guest code of whoever is watching
     * @return array{count: int, by_emoji: array<string, int>, mine: ?string}
     */
    public function reactionsSummary(?string $viewerCode = null): array
    {
        $reactions = $this->relationLoaded('reactions')
            ? $this->reactions
            : $this->reactions()->get();

        $mine = null;
        if ($viewerCode !== null && $viewerCode !== '') {
            $mine = $reactions->firstWhere('guest_code', $viewerCode)?->emoji;
        }

        return [
            'count' => $reactions->count(),
            'by_emoji' => $reactions->groupBy('emoji')->map(fn ($rows) => $rows->count())->sortDesc()->all(),
            'mine' => $mine,
        ];
    }
}
