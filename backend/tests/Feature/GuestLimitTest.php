<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class GuestLimitTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    private function setLimit(?int $limit): void
    {
        Setting::updateOrCreate(['key' => 'guest_limit'], ['value' => $limit === null ? null : (string) $limit]);
    }

    public function test_no_limit_by_default(): void
    {
        Guest::factory()->count(5)->create();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/guests', ['name' => 'Extra Guest'])
            ->assertCreated();
    }

    public function test_zero_or_empty_limit_means_unlimited(): void
    {
        $this->setLimit(0);
        Guest::factory()->count(3)->create();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/guests', ['name' => 'Extra Guest'])
            ->assertCreated();
    }

    public function test_cannot_add_guest_beyond_limit(): void
    {
        $this->setLimit(2);
        Guest::factory()->count(2)->create();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/guests', ['name' => 'One Too Many'])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('guest_limit', 2)
            ->assertJsonValidationErrors('guest_limit');

        $this->assertDatabaseMissing('guests', ['name' => 'One Too Many']);
        $this->assertSame(2, Guest::count());
    }

    public function test_can_add_guests_up_to_the_limit(): void
    {
        $this->setLimit(2);
        Guest::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/guests', ['name' => 'Last Seat'])
            ->assertCreated();

        $this->assertSame(2, Guest::count());
    }

    public function test_plus_ones_count_towards_the_limit(): void
    {
        $this->setLimit(3);
        Guest::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/guests', [
                'name' => 'Big Family',
                'plus_ones_allowed' => 2,
                'plus_ones_data' => [['name' => 'Partner'], ['name' => 'Child']],
            ])
            ->assertStatus(422);

        $this->assertSame(1, Guest::count());
    }

    public function test_adding_plus_ones_on_update_respects_the_limit(): void
    {
        $this->setLimit(2);
        $guest = Guest::factory()->create();
        Guest::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/guests/{$guest->id}", [
                'name' => $guest->name,
                'plus_ones_data' => [['name' => 'New Partner']],
            ])
            ->assertStatus(422);

        $this->assertSame(0, $guest->plusOnes()->count());
    }

    public function test_restoring_deleted_guests_respects_the_limit(): void
    {
        $deleted = Guest::factory()->create();
        $deleted->delete();
        Guest::factory()->count(2)->create();
        $this->setLimit(2);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/guests/restore', ['ids' => [$deleted->id]])
            ->assertStatus(422);

        $this->assertSoftDeleted('guests', ['id' => $deleted->id]);
    }

    public function test_import_beyond_the_limit_adds_no_one(): void
    {
        $this->setLimit(2);
        Guest::factory()->create();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/guests/import-confirm', [
                'valid' => [
                    ['name' => 'Import One', 'plus_ones_allowed' => 0],
                    ['name' => 'Import Two', 'plus_ones_allowed' => 0],
                ],
                'conflicts' => [],
            ])
            ->assertStatus(422);

        $this->assertSame(1, Guest::count());
    }

    public function test_direct_file_import_beyond_the_limit_is_rolled_back(): void
    {
        $this->setLimit(2);
        Guest::factory()->create();

        $csv = UploadedFile::fake()->createWithContent('guests.csv', implode("\n", [
            'names,email,telphone_number,number_of_invites,group',
            'Row One,,,1,Friends',
            'Row Two,,,1,Friends',
        ]));

        $this->actingAs($this->admin, 'sanctum')
            ->post('/api/guests/import', ['file' => $csv], ['Accept' => 'application/json'])
            ->assertStatus(422);

        $this->assertSame(1, Guest::count());
    }

    public function test_guest_limit_setting_must_be_a_non_negative_integer(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/settings', ['settings' => ['guest_limit' => 'lots']])
            ->assertStatus(422);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/settings', ['settings' => ['guest_limit' => -1]])
            ->assertStatus(422);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/settings', ['settings' => ['guest_limit' => '150']])
            ->assertOk();

        $this->assertDatabaseHas('settings', ['key' => 'guest_limit', 'value' => '150']);
    }

    public function test_statistics_report_the_guest_limit(): void
    {
        $this->setLimit(150);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/guests/statistics')
            ->assertOk()
            ->assertJsonPath('data.guest_limit', 150);
    }
}
