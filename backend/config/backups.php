<?php

/*
|--------------------------------------------------------------------------
| Database backups (App\Services\BackupService)
|--------------------------------------------------------------------------
|
| Local backups live in storage/app/backups. Scheduled backups can also be
| shipped off-site (`backups:create --offsite`). Everything is configured
| through the environment; credentials for remote disks belong in
| config/filesystems.php / .env, never here.
|
| Automatic safety backups are switched with AUTO_BACKUPS (config/app.php).
| (config/backup.php is the unrelated spatie/laravel-backup configuration.)
|
*/

return [

    'offsite' => [
        // Name of a filesystem disk from config/filesystems.php (e.g. "s3",
        // "ftp", "sftp"). Empty = no off-site copy on a disk.
        'disk' => env('BACKUP_OFFSITE_DISK') ?: null,

        // Folder on that disk the zips are written to (and pruned in).
        'path' => env('BACKUP_OFFSITE_PATH', 'backups'),

        // Comma-separated addresses that receive each scheduled backup.
        'email' => env('BACKUP_OFFSITE_EMAIL') ?: null,

        // Larger backups are announced by email but not attached.
        'email_max_mb' => (float) env('BACKUP_OFFSITE_EMAIL_MAX_MB', 15),
    ],

];
