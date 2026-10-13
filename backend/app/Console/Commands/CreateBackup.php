<?php

namespace App\Console\Commands;

use App\Services\BackupService;
use Illuminate\Console\Command;

class CreateBackup extends Command
{
    protected $signature = 'backups:create
        {--label=scheduled : Tag included in the file name}
        {--uploads : Also include public/uploads}
        {--keep=14 : How many backups with this label to keep (locally and off-site)}
        {--offsite : Also copy the backup to the off-site targets in config/backups.php}';

    protected $description = 'Back up the database (and optionally uploads) to storage/app/backups';

    public function handle(BackupService $backups): int
    {
        $keep = max(1, (int) $this->option('keep'));
        $backup = $backups->create($this->option('label'), (bool) $this->option('uploads'));
        $pruned = $backups->prune($backup['label'] ?? 'scheduled', $keep);

        $this->info("Created {$backup['name']} ({$backup['rows']} rows); pruned {$pruned} old backup(s).");

        if (! $this->option('offsite')) {
            return self::SUCCESS;
        }

        $results = $backups->shipOffsite($backup, $keep);
        if ($results === []) {
            $this->warn('No off-site target configured (set BACKUP_OFFSITE_DISK and/or BACKUP_OFFSITE_EMAIL).');

            return self::SUCCESS;
        }

        $failed = false;
        foreach ($results as $result) {
            if ($result['ok']) {
                $this->info("Off-site {$result['target']}: {$result['message']}");
            } else {
                $failed = true;
                $this->error("Off-site {$result['target']} FAILED: {$result['message']}");
            }
        }

        if ($failed) {
            $this->error("The local backup {$backup['name']} was kept, but at least one off-site copy failed.");

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
