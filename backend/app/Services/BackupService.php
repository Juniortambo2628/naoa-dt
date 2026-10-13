<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;
use ZipArchive;

/**
 * Database (and optional uploads) backups that work on any database driver:
 * every table is dumped to JSON inside a zip, so no mysqldump/sqlite3 binary
 * is needed on shared hosting. Restores replace table contents inside a
 * transaction after taking an automatic safety backup.
 */
class BackupService
{
    /** Tables that hold runtime/session state rather than wedding data. */
    private const SKIPPED_TABLES = [
        'migrations', 'personal_access_tokens', 'sessions', 'cache', 'cache_locks',
        'jobs', 'job_batches', 'failed_jobs', 'password_reset_tokens',
    ];

    private const NAME_PATTERN = '/^backup-\d{8}-\d{6}(-[a-z0-9-]+)?\.zip$/';

    private const INSERT_CHUNK = 200;

    public function directory(): string
    {
        $dir = storage_path('app/backups');
        File::ensureDirectoryExists($dir);

        return $dir;
    }

    /**
     * @return array<int, array{name: string, size: int, created_at: string, label: ?string, includes_uploads: bool, tables: int, rows: int}>
     */
    public function list(): array
    {
        return collect(File::files($this->directory()))
            ->filter(fn ($file) => preg_match(self::NAME_PATTERN, $file->getFilename()))
            ->map(fn ($file) => $this->describe($file->getPathname()))
            ->sortByDesc('created_at')
            ->values()
            ->all();
    }

    /**
     * Create a backup zip and return its description.
     *
     * @param  string|null  $label  short tag in the file name, e.g. "manual", "scheduled", "pre-restore"
     */
    public function create(?string $label = 'manual', bool $includeUploads = false): array
    {
        if (! class_exists(ZipArchive::class)) {
            throw new RuntimeException('The PHP zip extension is required for backups.');
        }

        $label = $label ? Str::slug($label) : null;
        $name = 'backup-'.now()->format('Ymd-His').($label ? "-{$label}" : '').'.zip';
        $path = $this->directory().DIRECTORY_SEPARATOR.$name;

        $tables = [];
        $rowCount = 0;
        foreach ($this->dataTables() as $table) {
            $rows = DB::table($table)->get()->map(fn ($row) => (array) $row)->all();
            $tables[$table] = $rows;
            $rowCount += count($rows);
        }

        $manifest = [
            'app' => config('app.name'),
            'created_at' => now()->toIso8601String(),
            'label' => $label,
            'driver' => DB::connection()->getDriverName(),
            'includes_uploads' => $includeUploads,
            'tables' => array_map('count', $tables),
            'rows' => $rowCount,
        ];

        $zip = new ZipArchive;
        if ($zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Could not create the backup file.');
        }
        $zip->addFromString('manifest.json', json_encode($manifest, JSON_PRETTY_PRINT));
        $zip->addFromString('database.json', json_encode($tables, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE));

        if ($includeUploads) {
            $this->addDirectory($zip, public_path('uploads'), 'uploads');
        }
        $zip->close();

        return $this->describe($path);
    }

    /**
     * Replace the database contents with a backup. A "pre-restore" backup is
     * taken first so the restore itself can be undone.
     *
     * @return array{restored_tables: int, restored_rows: int, safety_backup: string}
     */
    public function restore(string $name): array
    {
        $data = $this->readDatabase($this->path($name));
        $safety = $this->create('pre-restore');

        $existing = array_flip($this->dataTables());
        $restoredTables = 0;
        $restoredRows = 0;

        Schema::disableForeignKeyConstraints();
        try {
            DB::transaction(function () use ($data, $existing, &$restoredTables, &$restoredRows) {
                foreach ($data as $table => $rows) {
                    if (! isset($existing[$table])) {
                        continue; // table no longer exists in this schema
                    }
                    $columns = array_flip(Schema::getColumnListing($table));
                    DB::table($table)->delete();
                    // Keep only columns the current schema still has.
                    $rows = array_map(fn ($row) => array_intersect_key((array) $row, $columns), $rows);
                    foreach (array_chunk($rows, self::INSERT_CHUNK) as $chunk) {
                        DB::table($table)->insert($chunk);
                    }
                    $restoredTables++;
                    $restoredRows += count($rows);
                }
            });
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        return [
            'restored_tables' => $restoredTables,
            'restored_rows' => $restoredRows,
            'safety_backup' => $safety['name'],
        ];
    }

    /**
     * Safety copy before a risky bulk change; keeps the newest `$keep` with
     * this label. Never blocks the change itself if the backup fails.
     */
    public function snapshot(string $label, int $keep = 10): ?array
    {
        if (! config('app.auto_backups')) {
            return null;
        }

        try {
            $backup = $this->create($label);
            $this->prune($backup['label'], $keep);

            return $backup;
        } catch (\Throwable $e) {
            report($e);

            return null;
        }
    }

    public function delete(string $name): void
    {
        File::delete($this->path($name));
    }

    /** Delete the oldest backups carrying `$label`, keeping the newest `$keep`. */
    public function prune(string $label, int $keep): int
    {
        $old = collect($this->list())
            ->where('label', $label)
            ->slice($keep);
        $old->each(fn ($backup) => $this->delete($backup['name']));

        return $old->count();
    }

    /** Absolute path of a named backup, rejecting anything that isn't one. */
    public function path(string $name): string
    {
        if (! preg_match(self::NAME_PATTERN, $name)) {
            throw new InvalidArgumentException('Invalid backup name.');
        }
        $path = $this->directory().DIRECTORY_SEPARATOR.$name;
        if (! File::exists($path)) {
            throw new InvalidArgumentException('Backup not found.');
        }

        return $path;
    }

    /** @return string[] */
    private function dataTables(): array
    {
        return collect(Schema::getTableListing(schemaQualified: false))
            ->reject(fn ($table) => in_array($table, self::SKIPPED_TABLES, true) || str_starts_with($table, 'sqlite_'))
            ->values()
            ->all();
    }

    private function readDatabase(string $path): array
    {
        $zip = new ZipArchive;
        if ($zip->open($path) !== true) {
            throw new RuntimeException('Could not open the backup file.');
        }
        $json = $zip->getFromName('database.json');
        $zip->close();

        $data = $json === false ? null : json_decode($json, true);
        if (! is_array($data)) {
            throw new RuntimeException('The backup file is damaged or incomplete.');
        }

        return $data;
    }

    private function describe(string $path): array
    {
        $manifest = [];
        $zip = new ZipArchive;
        if ($zip->open($path) === true) {
            $manifest = json_decode((string) $zip->getFromName('manifest.json'), true) ?: [];
            $zip->close();
        }

        return [
            'name' => basename($path),
            'size' => File::size($path),
            'created_at' => $manifest['created_at'] ?? Carbon::createFromTimestamp(File::lastModified($path))->toIso8601String(),
            'label' => $manifest['label'] ?? null,
            'includes_uploads' => (bool) ($manifest['includes_uploads'] ?? false),
            'tables' => count($manifest['tables'] ?? []),
            'rows' => (int) ($manifest['rows'] ?? 0),
        ];
    }

    private function addDirectory(ZipArchive $zip, string $dir, string $prefix): void
    {
        if (! File::isDirectory($dir)) {
            return;
        }
        foreach (File::allFiles($dir) as $file) {
            $zip->addFile($file->getPathname(), $prefix.'/'.str_replace('\\', '/', $file->getRelativePathname()));
        }
    }
}
