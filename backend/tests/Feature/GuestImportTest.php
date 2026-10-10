<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class GuestImportTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
    }

    private function csv(array $rows): UploadedFile
    {
        $lines = ['names,email,telphone_number,number_of_invites,group'];
        foreach ($rows as $r) {
            $lines[] = implode(',', $r);
        }

        return UploadedFile::fake()->createWithContent('guests.csv', implode("\n", $lines));
    }

    private function preview(array $rows): array
    {
        return $this->actingAs($this->admin, 'sanctum')
            ->post('/api/guests/validate-import', ['file' => $this->csv($rows)])
            ->assertOk()
            ->json('data');
    }

    private function confirm(array $valid, array $conflicts = []): array
    {
        return $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/guests/import-confirm', compact('valid', 'conflicts'))
            ->assertOk()
            ->json('data');
    }

    public function test_existing_guests_are_matched_case_insensitively_by_name_or_email(): void
    {
        Guest::factory()->create(['name' => 'Ann Kairu', 'email' => 'ann@example.com', 'phone' => '+254717215425', 'plus_ones_allowed' => 0]);

        $data = $this->preview([
            ['ANN  KAIRU', 'ann@example.com', '+254717215425', 1, 'Family'], // same person, messy name
            ['Ann K.', 'ANN@EXAMPLE.COM', '', 1, 'Family'],                // same email, different case
        ]);

        $this->assertSame([], $data['valid'], 'no new guests should be created');
    }

    public function test_family_members_sharing_a_phone_are_separate_guests(): void
    {
        Guest::factory()->create(['name' => 'Esther Oyoo', 'email' => null, 'phone' => '+254722591814', 'plus_ones_allowed' => 0]);

        $data = $this->preview([
            ['Esther Oyoo', '', '+254722591814', 1, ''],
            ['Nanette Oyoo', '', '+254722591814', 1, ''],
            ['Nathan Oyoo', '', '+254722591814', 1, ''],
        ]);

        $this->assertSame(['Nanette Oyoo', 'Nathan Oyoo'], array_column($data['valid'], 'name'));
    }

    public function test_the_final_guest_list_tab_is_used_when_present(): void
    {
        $book = new \PhpOffice\PhpSpreadsheet\Spreadsheet;
        $book->getActiveSheet()->setTitle('Draft')->fromArray([['Names', 'Email'], ['Draft Person', 'draft@example.com']]);
        $book->createSheet()->setTitle('Final-guest-list')->fromArray([
            ['Orig #', 'Names', 'Number of Invites', 'Telphone number', 'Email', 'Save the Date sent via (whatsapp/email)', 'Notes'],
            [1, 'Final Person', 1, null, 'final@example.com', 'E-mail', null],
        ]);
        // Phones are stored as text in the guest sheet, so keep the leading "+".
        $book->getSheetByName('Final-guest-list')->setCellValueExplicit('D2', '+19059203068', \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
        $path = tempnam(sys_get_temp_dir(), 'gl').'.xlsx';
        (new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($book))->save($path);

        $data = $this->actingAs($this->admin, 'sanctum')
            ->post('/api/guests/validate-import', ['file' => new UploadedFile($path, 'guests.xlsx', null, null, true)])
            ->assertOk()->json('data');

        $this->assertSame(['Final Person'], array_column($data['valid'], 'name'));
        $this->assertSame('+19059203068', $data['valid'][0]['phone']);
        $this->assertSame('final@example.com', $data['valid'][0]['email']);
        $this->assertSame('E-mail', $data['valid'][0]['save_the_date_method']);
        $this->assertSame(0, $data['valid'][0]['plus_ones_allowed']);
    }

    public function test_duplicate_rows_within_the_file_are_imported_once(): void
    {
        $data = $this->preview([
            ['Peres Otiende', 'peres@example.com', '', 1, 'Friends'],
            ['peres otiende', '', '', 1, 'Friends'],
            ['Someone Else', 'peres@example.com', '', 1, 'Friends'],
        ]);

        $this->assertCount(1, $data['valid']);
        $this->confirm($data['valid']);
        $this->assertSame(1, Guest::count());
    }

    public function test_confirming_twice_does_not_duplicate(): void
    {
        $data = $this->preview([['Diane Kim', 'diane@example.com', '', 1, 'Invited']]);

        $this->confirm($data['valid']);
        $second = $this->confirm($data['valid']);

        $this->assertSame(1, Guest::count());
        $this->assertSame(1, $second['skipped']);
    }

    public function test_overwrite_and_merge_keep_rsvp_and_invitation_status(): void
    {
        foreach (['overwrite', 'merge'] as $resolution) {
            Guest::query()->forceDelete();
            $guest = Guest::factory()->create([
                'name' => 'Francis Premont', 'email' => 'fp@example.com', 'phone' => null,
                'rsvp_status' => 'confirmed', 'rsvp_message' => 'See you there', 'plus_ones_allowed' => 0,
            ]);
            $guest->invitation()->create(['status' => 'sent', 'sent_at' => now()]);
            $code = $guest->unique_code;

            $data = $this->preview([['Francis Premont', 'fp@example.com', '+254700000001', 1, 'Work']]);
            $this->assertCount(1, $data['conflicts'], $resolution);

            $conflict = $data['conflicts'][0] + ['resolution' => $resolution];
            $this->confirm([], [$conflict]);

            $guest->refresh();
            $this->assertSame('confirmed', $guest->rsvp_status, $resolution);
            $this->assertSame('See you there', $guest->rsvp_message, $resolution);
            $this->assertSame($code, $guest->unique_code, $resolution);
            $this->assertSame('sent', $guest->invitation->status, $resolution);
            $this->assertStringEndsWith('254700000001', (string) $guest->phone, $resolution);
        }
    }

    public function test_reimport_adds_missing_plus_ones_without_touching_existing_ones(): void
    {
        $guest = Guest::factory()->create(['name' => 'Benita Foo', 'email' => 'b@example.com', 'phone' => null, 'save_the_date_method' => null, 'plus_ones_allowed' => 0]);
        $po = Guest::create(['name' => 'Benita Foo (Plus One 1)', 'parent_guest_id' => $guest->id, 'plus_ones_allowed' => 0, 'rsvp_status' => 'confirmed']);
        Invitation::create(['guest_id' => $po->id, 'status' => 'sent']);

        // Same plus-one count: nothing to do, not a conflict.
        $data = $this->preview([['Benita Foo', 'b@example.com', '', 2, '']]);
        $this->assertSame([], $data['conflicts']);
        $this->assertSame([], $data['valid']);

        // One more plus-one requested: existing plus-one keeps its RSVP.
        $data = $this->preview([['Benita Foo', 'b@example.com', '', 3, '']]);
        $this->confirm([], [$data['conflicts'][0] + ['resolution' => 'merge']]);

        $this->assertSame(2, $guest->plusOnes()->count());
        $this->assertSame('confirmed', $po->fresh()->rsvp_status);
    }
}
