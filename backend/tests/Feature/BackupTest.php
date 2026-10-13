<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\User;
use App\Services\BackupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

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

    public function test_backups_require_authentication(): void
    {
        $this->getJson('/api/backups')->assertUnauthorized();
    }
}
