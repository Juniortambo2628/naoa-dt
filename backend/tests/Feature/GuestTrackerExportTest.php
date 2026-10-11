<?php

namespace Tests\Feature;

use App\Exports\GuestTrackerExport;
use App\Models\Guest;
use App\Models\Invitation;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Maatwebsite\Excel\Facades\Excel;
use Tests\TestCase;

class GuestTrackerExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_must_be_authenticated(): void
    {
        $this->getJson('/api/export/guest-tracker')->assertUnauthorized();
    }

    public function test_tracker_splits_guests_and_builds_whatsapp_message(): void
    {
        Excel::fake();

        $invited = Guest::factory()->create(['name' => 'Caren Ouma', 'phone' => '+254722335525', 'rsvp_status' => 'pending']);
        Invitation::create(['guest_id' => $invited->id, 'status' => 'sent', 'sent_at' => now()]);
        $remaining = Guest::factory()->create(['name' => 'Julie Ouma', 'phone' => '+254737451618', 'rsvp_status' => 'pending']);
        Invitation::create(['guest_id' => $remaining->id, 'status' => 'pending']);
        Guest::factory()->create(['name' => 'Plus One', 'parent_guest_id' => $invited->id]);

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->get('/api/export/guest-tracker?base_url=https://dntwed.okjtech.co.ke')
            ->assertOk();

        Excel::assertDownloaded('guest-invite-tracker.xlsx', function (GuestTrackerExport $export) use ($invited, $remaining) {
            [$all, $remainingSheet, $invitedSheet] = $export->sheets();

            $this->assertSame(['Caren Ouma', 'Julie Ouma'], $all->collection()->pluck('name')->all());
            $this->assertSame(['Julie Ouma'], $remainingSheet->collection()->pluck('name')->all());
            $this->assertSame(['Caren Ouma'], $invitedSheet->collection()->pluck('name')->all());

            $row = $remainingSheet->map($remaining->fresh('invitation'));
            $this->assertSame($remaining->unique_code, $row[4]);
            $this->assertSame('Not yet invited', $row[5]);
            $this->assertStringContainsString('Hi *Julie Ouma*!', $row[10]);
            $this->assertStringContainsString('https://dntwed.okjtech.co.ke/invitation/'.$remaining->unique_code, $row[10]);
            $this->assertStringStartsWith('https://wa.me/254737451618?text=', $row[11]);
            $this->assertStringNotContainsString('{pdf_link}', $row[10]);
            $this->assertStringNotContainsString('invitation card (PDF)', $row[10]);

            $this->assertSame('Invited', $invitedSheet->map($invited->fresh('invitation'))[5]);

            return true;
        });
    }

    public function test_tracker_can_be_limited_to_one_group(): void
    {
        Excel::fake();

        Guest::factory()->create(['name' => 'Hellen Apiyo', 'group' => "Mom's friends"]);
        Guest::factory()->create(['name' => 'Bob Ouma', 'group' => 'family']);

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->get('/api/export/guest-tracker?group='.urlencode("Mom's friends"))
            ->assertOk();

        Excel::assertDownloaded('guest-invite-tracker-moms-friends.xlsx', function (GuestTrackerExport $export) {
            $this->assertSame(['Hellen Apiyo'], $export->sheets()[0]->collection()->pluck('name')->all());

            return true;
        });
    }

    public function test_tracker_uses_the_whatsapp_template_from_settings(): void
    {
        Excel::fake();

        Setting::create(['key' => 'whatsapp_message_template', 'value' => "Hello {name}, code {code}\nPDF: {pdf_link}\n{invite_link}"]);
        $guest = Guest::factory()->create(['name' => 'Nelly Okanda', 'phone' => '+254713698581']);

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->get('/api/export/guest-tracker?base_url=https://dntwed.okjtech.co.ke')
            ->assertOk();

        Excel::assertDownloaded('guest-invite-tracker.xlsx', function (GuestTrackerExport $export) use ($guest) {
            $row = $export->sheets()[0]->map($guest->fresh('invitation'));
            $this->assertSame(
                "Hello Nelly Okanda, code {$guest->unique_code}\nhttps://dntwed.okjtech.co.ke/invitation/{$guest->unique_code}",
                $row[10]
            );

            return true;
        });
    }
}
