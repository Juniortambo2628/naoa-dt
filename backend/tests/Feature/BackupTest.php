<?php

namespace Tests\Feature;

use App\Mail\BackupCreated;
use App\Models\Guest;
use App\Models\User;
use App\Services\BackupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use ZipArchive;

class BackupTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private string $storage;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
        // Isolated storage so the suite never touches real backups.
        $this->storage = sys_get_temp_dir().'/naoa-backups-'.uniqid();
        $this->app->useStoragePath($this->storage);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->storage);
        parent::tearDown();
    }

    public function test_admin_can_create_list_and_download_a_backup(): void
    {
        Guest::factory()->count(3)->create();

        $created = $this->actingAs($this->admin, 'sanctum')->postJson('/api/backups')
            ->assertCreated()
            ->json('data');

        $this->assertMatchesRegularExpression('/^backup-\d{8}-\d{6}-manual\.zip$/', $created['name']);
        $this->assertGreaterThanOrEqual(4, $created['rows']); // 3 guests + 1 user at least

        $this->actingAs($this->admin, 'sanctum')->getJson('/api/backups')
            ->assertOk()
            ->assertJsonPath('data.0.name', $created['name']);

        $this->actingAs($this->admin, 'sanctum')->get("/api/backups/{$created['name']}/download")
            ->assertOk()
            ->assertHeader('content-type', 'application/zip');
    }

    public function test_restore_brings_back_deleted_data_and_takes_a_safety_backup(): void
    {
        $guest = Guest::factory()->create(['name' => 'Keep Me']);
        $backup = app(BackupService::class)->create('manual');

        $guest->forceDelete();
        Guest::factory()->create(['name' => 'Added Later']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/backups/{$backup['name']}/restore")
            ->assertOk();

        $this->assertDatabaseHas('guests', ['name' => 'Keep Me']);
        $this->assertDatabaseMissing('guests', ['name' => 'Added Later']);
        $this->assertStringContainsString('pre-restore', $response->json('data.safety_backup'));
        $this->assertCount(2, app(BackupService::class)->list());
    }

    public function test_invalid_names_are_rejected(): void
    {
        $this->actingAs($this->admin, 'sanctum')->deleteJson('/api/backups/..%2F.env')->assertNotFound();
        $this->actingAs($this->admin, 'sanctum')->postJson('/api/backups/backup-20260101-000000.zip/restore')->assertNotFound();
    }

    public function test_command_prunes_old_scheduled_backups(): void
    {
        $service = app(BackupService::class);
        foreach (range(1, 3) as $i) {
            $this->travel($i)->seconds();
            $service->create('scheduled');
        }

        $this->artisan('backups:create', ['--keep' => 2])->assertSuccessful();

        $this->assertCount(2, collect($service->list())->where('label', 'scheduled'));
    }

    public function test_offsite_disk_receives_the_backup_and_is_pruned_to_keep(): void
    {
        Storage::fake('offsite');
        config(['backups.offsite.disk' => 'offsite', 'backups.offsite.email' => null]);
        $disk = Storage::disk('offsite');
        $disk->put('backups/backup-20200101-000000-scheduled.zip', 'old');
        $disk->put('backups/backup-20200102-000000-scheduled.zip', 'old');
        $disk->put('backups/backup-20200101-000000-manual.zip', 'other label');

        $this->artisan('backups:create', ['--keep' => 2, '--offsite' => true])->assertSuccessful();

        $local = app(BackupService::class)->list()[0]['name'];
        $disk->assertExists("backups/{$local}");
        $disk->assertExists('backups/backup-20200102-000000-scheduled.zip');
        $disk->assertMissing('backups/backup-20200101-000000-scheduled.zip');
        $disk->assertExists('backups/backup-20200101-000000-manual.zip');
    }

    public function test_offsite_email_attaches_the_backup(): void
    {
        Mail::fake();
        config(['backups.offsite.disk' => null, 'backups.offsite.email' => 'one@example.com, two@example.com']);

        $this->artisan('backups:create', ['--offsite' => true])->assertSuccessful();

        Mail::assertSent(BackupCreated::class, function (BackupCreated $mail) {
            return $mail->hasTo('one@example.com')
                && $mail->hasTo('two@example.com')
                && count($mail->attachments()) === 1
                && str_contains($mail->render(), 'attached to this email');
        });
    }

    public function test_offsite_email_skips_attachment_over_the_size_limit(): void
    {
        Mail::fake();
        config([
            'backups.offsite.disk' => null,
            'backups.offsite.email' => 'one@example.com',
            'backups.offsite.email_max_mb' => 0,
        ]);

        $this->artisan('backups:create', ['--offsite' => true])->assertSuccessful();

        Mail::assertSent(BackupCreated::class, fn (BackupCreated $mail) => $mail->attachments() === []
            && str_contains($mail->render(), 'was not attached'));
    }

    public function test_offsite_is_only_used_with_the_flag(): void
    {
        Mail::fake();
        Storage::fake('offsite');
        config(['backups.offsite.disk' => 'offsite', 'backups.offsite.email' => 'one@example.com']);

        $this->artisan('backups:create')->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertSame([], Storage::disk('offsite')->allFiles());
    }

    public function test_offsite_failure_fails_the_command_but_keeps_the_local_backup(): void
    {
        Mail::fake();
        config(['backups.offsite.disk' => 'no-such-disk', 'backups.offsite.email' => 'one@example.com']);

        $this->artisan('backups:create', ['--offsite' => true])
            ->expectsOutputToContain('FAILED')
            ->assertFailed();

        $this->assertCount(1, app(BackupService::class)->list());
        Mail::assertSent(BackupCreated::class); // the other target still ran
    }

    public function test_verify_restores_into_a_throwaway_database_and_leaves_real_data_alone(): void
    {
        Guest::factory()->count(3)->create();
        $backup = app(BackupService::class)->create('manual');
        Guest::factory()->create(['name' => 'Added After Backup']);

        $this->artisan('backups:verify')
            ->expectsOutputToContain('restored cleanly')
            ->assertSuccessful();

        $this->assertDatabaseHas('guests', ['name' => 'Added After Backup']);
        $this->assertSame(4, Guest::count());
        $this->assertCount(1, app(BackupService::class)->list()); // no pre-restore safety backup
        $this->assertNull(config('database.connections.'.BackupService::VERIFY_CONNECTION));

        $this->artisan('backups:verify', ['name' => $backup['name']])->assertSuccessful();
    }

    public function test_verify_fails_when_row_counts_do_not_match_the_manifest(): void
    {
        Guest::factory()->count(2)->create();
        $backup = app(BackupService::class)->create('manual');
        $path = app(BackupService::class)->path($backup['name']);

        $zip = new ZipArchive;
        $zip->open($path);
        $manifest = json_decode($zip->getFromName('manifest.json'), true);
        $manifest['tables']['guests'] = 99;
        $zip->addFromString('manifest.json', json_encode($manifest));
        $zip->close();

        $this->artisan('backups:verify', ['name' => $backup['name']])
            ->expectsOutputToContain('MISMATCH')
            ->assertFailed();
    }

    public function test_verify_fails_without_backups_or_for_unknown_names(): void
    {
        $this->artisan('backups:verify')->assertFailed();
        $this->artisan('backups:verify', ['name' => 'backup-20200101-000000.zip'])->assertFailed();
    }

    public function test_admin_can_verify_a_backup_via_the_api(): void
    {
        Guest::factory()->count(3)->create();
        $backup = app(BackupService::class)->create('manual');

        $tables = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/backups/{$backup['name']}/verify")
            ->assertOk()
            ->assertJsonPath('data.ok', true)
            ->assertJsonPath('data.name', $backup['name'])
            ->json('data.tables');

        $guests = collect($tables)->firstWhere('table', 'guests');
        $this->assertSame(['table' => 'guests', 'expected' => 3, 'restored' => 3, 'ok' => true], $guests);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/backups/backup-20200101-000000.zip/verify')
            ->assertNotFound();
    }

    public function test_backups_require_authentication(): void
    {
        $this->getJson('/api/backups')->assertUnauthorized();
        $this->postJson('/api/backups/backup-20200101-000000-manual.zip/verify')->assertUnauthorized();
    }
}
