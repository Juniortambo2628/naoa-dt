<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * One entry in the admin version history: a snapshot of a record before and
 * after a change, so any version can be restored. Recorded automatically by
 * the RecordsRevisions trait.
 */
class Revision extends Model
{
    use MassPrunable;

    /** Rapid edits by the same person to the same record merge into one version. */
    public const COALESCE_MINUTES = 10;

    /** Versions older than this are pruned (model:prune). */
    public const KEEP_DAYS = 180;

    /** Columns that never make a change worth a version on their own. */
    private const NOISE = ['created_at', 'updated_at', 'deleted_at'];

    protected $fillable = [
        'module', 'subject_type', 'subject_id', 'subject_label', 'action',
        'before', 'after', 'changed', 'user_id', 'batch',
    ];

    protected $casts = ['changed' => 'array'];

    protected $hidden = ['before', 'after'];

    /** Set while restoring, so the resulting changes are labelled "restored". */
    private static bool $restoring = false;

    /** Recording is paused while migrations run (see AppServiceProvider). */
    private static bool $paused = false;

    public static function pause(): void
    {
        self::$paused = true;
    }

    public static function resume(): void
    {
        self::$paused = false;
    }

    public static function isRestoring(): bool
    {
        return self::$restoring;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function prunable(): Builder
    {
        return static::where('created_at', '<', now()->subDays(self::KEEP_DAYS));
    }

    /** Groups every change made by one request (e.g. one settings save). */
    public static function batchId(): string
    {
        $attributes = request()->attributes;
        if (! $attributes->has('revision_batch')) {
            $attributes->set('revision_batch', (string) Str::uuid());
        }

        return $attributes->get('revision_batch');
    }

    public static function record(Model $model, string $action): ?self
    {
        if (self::$paused) {
            return null;
        }

        $after = $action === 'deleted' ? null : $model->getAttributes();
        $before = match ($action) {
            'created' => null,
            'deleted' => $model->getAttributes(),
            default => $model->getRawOriginal(),
        };

        $changed = null;
        if ($action === 'updated') {
            $changed = array_values(array_filter(
                array_keys($model->getChanges()),
                fn ($key) => ! in_array($key, self::NOISE, true),
            ));
            $changed = array_values(array_diff($changed, $model->revisionIgnored()));
            if (! $changed) {
                return null;
            }
        }

        if (self::$restoring) {
            $action = 'restored';
        }

        $userId = auth('sanctum')->id() ?? auth()->id();
        $module = $model->revisionModule($changed ?? []);

        if ($action === 'updated' && $userId && ($merged = self::coalesce($model, $userId, $after, $changed))) {
            return $merged;
        }

        return self::create([
            'module' => $module,
            'subject_type' => $model->getMorphClass(),
            'subject_id' => $model->getKey(),
            'subject_label' => Str::limit((string) $model->revisionLabel(), 250),
            'action' => $action,
            'before' => $before === null ? null : json_encode($before),
            'after' => $after === null ? null : json_encode($after),
            'changed' => $changed,
            'user_id' => $userId,
            'batch' => self::batchId(),
        ]);
    }

    /** Fold a quick follow-up edit into the editor's previous version of the record. */
    private static function coalesce(Model $model, int $userId, array $after, array $changed): ?self
    {
        $latest = self::where('subject_type', $model->getMorphClass())
            ->where('subject_id', $model->getKey())
            ->latest('id')
            ->first();

        if (! $latest || $latest->action !== 'updated' || $latest->user_id !== $userId
            || $latest->created_at->lt(now()->subMinutes(self::COALESCE_MINUTES))) {
            return null;
        }

        $latest->after = json_encode($after);
        $latest->changed = array_values(array_unique(array_merge($latest->changed ?? [], $changed)));
        $latest->subject_label = Str::limit((string) $model->revisionLabel(), 250);
        $latest->save();

        return $latest;
    }

    public function beforeData(): ?array
    {
        return $this->before === null ? null : json_decode($this->before, true);
    }

    public function afterData(): ?array
    {
        return $this->after === null ? null : json_decode($this->after, true);
    }

    /** Changed fields with short before/after values, for the history list. */
    public function diff(): array
    {
        $before = $this->beforeData() ?? [];
        $after = $this->afterData() ?? [];
        $short = fn ($value) => $value === null ? null : Str::limit(is_scalar($value) ? (string) $value : json_encode($value), 140);

        return collect($this->changed ?? [])
            ->map(fn ($key) => ['field' => $key, 'before' => $short($before[$key] ?? null), 'after' => $short($after[$key] ?? null)])
            ->all();
    }

    /** Whether this version can be brought back (its record type still records history). */
    public function isRestorable(): bool
    {
        $class = Relation::getMorphedModel($this->subject_type) ?? $this->subject_type;

        return class_exists($class) && ($this->action === 'deleted' ? $this->before : $this->after) !== null;
    }

    /**
     * Make the record look like it did in this version: the state after the
     * change, or — for a deletion — the record as it was before being deleted.
     */
    public function restoreVersion(): Model
    {
        $class = Relation::getMorphedModel($this->subject_type) ?? $this->subject_type;
        $snapshot = $this->action === 'deleted' ? $this->beforeData() : $this->afterData();
        if (! class_exists($class) || $snapshot === null) {
            throw new \RuntimeException('This version cannot be restored.');
        }

        return DB::transaction(function () use ($class, $snapshot) {
            self::$restoring = true;
            try {
                $softDeletes = in_array(SoftDeletes::class, class_uses_recursive($class), true);
                $query = $softDeletes ? $class::withTrashed() : $class::query();
                $model = $this->subject_id ? $query->find($this->subject_id) : null;

                if ($model && $softDeletes && $model->trashed()) {
                    $model->restore();
                }

                $values = Arr::except($snapshot, self::NOISE);
                if ($model) {
                    $model->setRawAttributes(array_merge($model->getAttributes(), Arr::except($values, [$model->getKeyName()])));
                    $model->save();
                } else {
                    $model = new $class;
                    $model->setRawAttributes($values);
                    $model->save();
                }

                return $model;
            } finally {
                self::$restoring = false;
            }
        });
    }
}
