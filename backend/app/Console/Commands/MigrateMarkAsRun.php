<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\Migrations\Migrator;

/**
 * Record migrations as run without executing them.
 *
 * Recovery tool for when a schema change was already applied out-of-band (for
 * example imported directly into the database) but the corresponding row is
 * missing from the `migrations` table, so `php artisan migrate` keeps trying
 * to re-run it and fails with "table already exists" / "duplicate column".
 *
 * This only writes to the `migrations` table; it never touches the schema.
 * The operator is asserting the schema is already in place. Prefer this over
 * editing the migrations table by hand.
 *
 *   php artisan migrate:mark-as-run                       # mark every pending migration
 *   php artisan migrate:mark-as-run 2026_09_12_000002_... # mark specific migration(s)
 *   php artisan migrate:mark-as-run --pretend             # show what would be marked
 */
class MigrateMarkAsRun extends Command
{
    protected $signature = 'migrate:mark-as-run
                            {migration?* : Migration name(s) without the .php extension; omit to mark every pending migration}
                            {--batch= : Batch number to record (defaults to the next batch)}
                            {--pretend : List what would be marked without writing to the migrations table}';

    protected $description = 'Record migrations as run (in the migrations table) without executing them, for schema already applied out-of-band';

    public function handle(Migrator $migrator): int
    {
        $repository = $migrator->getRepository();

        if (! $repository->repositoryExists()) {
            $this->components->error('The migrations table does not exist. Run "php artisan migrate:install" first.');

            return self::FAILURE;
        }

        $paths = array_merge([database_path('migrations')], $migrator->paths());

        // Map of migration name (filename without .php) => absolute path.
        $onDisk = collect($migrator->getMigrationFiles($paths));
        $alreadyRun = collect($repository->getRan());

        $requested = (array) $this->argument('migration');

        if (! empty($requested)) {
            // Normalise any accidentally-supplied .php extension.
            $requested = array_map(fn ($name) => preg_replace('/\.php$/', '', $name), $requested);

            $unknown = array_diff($requested, $onDisk->keys()->all());
            if (! empty($unknown)) {
                $this->components->error('Unknown migration(s): '.implode(', ', $unknown));

                return self::FAILURE;
            }

            $targets = collect($requested);
        } else {
            // All pending migrations (on disk but not yet recorded).
            $targets = $onDisk->keys()->reject(fn ($name) => $alreadyRun->contains($name))->values();
        }

        // Skip anything already recorded.
        $toMark = $targets->reject(fn ($name) => $alreadyRun->contains($name))->values();
        $skipped = $targets->filter(fn ($name) => $alreadyRun->contains($name))->values();

        foreach ($skipped as $name) {
            $this->components->twoColumnDetail($name, '<fg=yellow>already recorded, skipping</>');
        }

        if ($toMark->isEmpty()) {
            $this->components->info('Nothing to mark — every target migration is already recorded.');

            return self::SUCCESS;
        }

        $batch = $this->option('batch') !== null
            ? (int) $this->option('batch')
            : $repository->getNextBatchNumber();

        foreach ($toMark as $name) {
            if ($this->option('pretend')) {
                $this->components->twoColumnDetail($name, "<fg=cyan>would mark as run (batch {$batch})</>");

                continue;
            }

            $repository->log($name, $batch);
            $this->components->twoColumnDetail($name, "<fg=green>marked as run (batch {$batch})</>");
        }

        if ($this->option('pretend')) {
            $this->components->info('Pretend run — nothing was written.');
        } else {
            $this->components->info($toMark->count().' migration(s) recorded in batch '.$batch.'. They will be skipped by future "migrate" runs.');
        }

        return self::SUCCESS;
    }
}
