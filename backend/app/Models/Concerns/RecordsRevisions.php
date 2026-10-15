<?php

namespace App\Models\Concerns;

use App\Models\Revision;

/**
 * Keeps a version history of the model in `revisions` (see Revision), which
 * powers the admin "Version history" panel and the sidebar "new" badges.
 *
 * Models set `protected string $revisionModule` to the admin module (sidebar
 * key) they belong to, and may override revisionModule() / revisionLabel() /
 * revisionIgnored().
 */
trait RecordsRevisions
{
    public static function bootRecordsRevisions(): void
    {
        static::created(fn ($model) => Revision::record($model, 'created'));
        static::updated(fn ($model) => Revision::record($model, 'updated'));
        static::deleted(fn ($model) => Revision::record($model, 'deleted'));
        // Soft-deletable models: undeleting (e.g. "Undo" after a delete) is a version too.
        if (method_exists(static::class, 'restored')) {
            static::restored(fn ($model) => Revision::isRestoring() ? null : Revision::record($model, 'restored'));
        }
    }

    /** @param  array<int, string>  $changed  attributes changed by this update */
    public function revisionModule(array $changed = []): string
    {
        return property_exists($this, 'revisionModule') ? $this->revisionModule : 'general';
    }

    /** Human name of the record for the history list. */
    public function revisionLabel(): string
    {
        foreach (['name', 'title', 'question', 'section_key', 'key', 'caption', 'subject'] as $attribute) {
            if (filled($this->getAttribute($attribute))) {
                return (string) $this->getAttribute($attribute);
            }
        }

        return class_basename($this).' #'.$this->getKey();
    }

    /** Attributes whose changes alone don't warrant a new version. */
    public function revisionIgnored(): array
    {
        return [];
    }
}
