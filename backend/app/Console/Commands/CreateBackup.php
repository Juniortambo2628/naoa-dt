<?php

namespace App\Console\Commands;

use App\Services\BackupService;
use Illuminate\Console\Command;

class CreateBackup extends Command
{
    protected $signature = 'backups:create
        {--label=scheduled : Tag included in the file name}
        {--uploads : Also include public/uploads}
        {--keep=14 : How many backups with this label to keep}';

    protected $description = 'Back up the database (and optionally uploads) to storage/app/backups';

    public function handle(BackupService $backups): int
    {
        $backup = $backups->create($this->option('label'), (bool) $this->option('uploads'));
        $pruned = $backups->prune($backup['label'] ?? 'scheduled', max(1, (int) $this->option('keep')));

        $this->info("Created {$backup['name']} ({$backup['rows']} rows); pruned {$pruned} old backup(s).");

        return self::SUCCESS;
    }
}
