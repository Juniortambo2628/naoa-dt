<?php

namespace App\Console\Commands;

use App\Services\BackupService;
use Illuminate\Console\Command;
use InvalidArgumentException;

class VerifyBackup extends Command
{
    protected $signature = 'backups:verify {name? : Backup file name (default: the newest backup)}';

    protected $description = 'Restore a backup into a throwaway in-memory database and check every table\'s row count';

    public function handle(BackupService $backups): int
    {
        $name = $this->argument('name') ?? ($backups->list()[0]['name'] ?? null);
        if ($name === null) {
            $this->error('There are no backups to verify.');

            return self::FAILURE;
        }

        try {
            $result = $backups->verify($name);
        } catch (InvalidArgumentException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        if ($result['tables'] !== []) {
            $this->table(
                ['Table', 'In backup', 'Restored', 'Status'],
                array_map(fn ($row) => [
                    $row['table'],
                    $row['expected'],
                    $row['restored'] ?? 'missing table',
                    $row['ok'] ? 'OK' : 'MISMATCH',
                ], $result['tables'])
            );
        }

        if ($result['error']) {
            $this->error("Verifying {$name} failed: {$result['error']}");

            return self::FAILURE;
        }

        if (! $result['ok']) {
            $bad = collect($result['tables'])->reject(fn ($row) => $row['ok'])->count();
            $this->error("{$name}: {$bad} table(s) did not restore to the expected row count.");

            return self::FAILURE;
        }

        $this->info("{$name} restored cleanly (".count($result['tables']).' tables).');

        return self::SUCCESS;
    }
}
