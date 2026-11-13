<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\MpesaPayment;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Pay Bill gifts a guest sent from their M-Pesa menu and recorded on the invitation. */
class MpesaPaybillReportTest extends TestCase
{
    use RefreshDatabase;

    private function guest(string $code = 'GRACE26', string $name = 'Grace Muthoni'): Guest
    {
        return Guest::create(['name' => $name, 'email' => strtolower($code).'@example.com', 'unique_code' => $code]);
    }

    private function report(array $overrides = [])
    {
        return $this->postJson('/api/gifts/mpesa/report', array_merge([
            'guest_code' => 'GRACE26',
            'amount' => 2000,
            'receipt' => 'tkd4abc12x',
            'giver_name' => 'Grace Muthoni',
            'idempotency_key' => 'key-1',
        ], $overrides));
    }

    public function test_a_guest_records_a_paybill_gift(): void
    {
        $this->guest();
        Setting::updateOrCreate(['key' => 'mpesa_paybill_account'], ['value' => '0100301493000']);

        $this->report(['message' => 'Congratulations!'])
            ->assertCreated()
            ->assertJsonPath('data.amount', 2000)
            ->assertJsonPath('data.status', 'reported')
            ->assertJsonPath('data.method', 'paybill')
            ->assertJsonPath('data.receipt', 'TKD4ABC12X');

        $payment = MpesaPayment::firstOrFail();
        $this->assertSame('0100301493000', $payment->account_reference);
        $this->assertSame('Congratulations!', $payment->message);
    }

    public function test_the_same_code_or_double_tap_is_recorded_once(): void
    {
        $this->guest();
        $this->report()->assertCreated();
        $this->report()->assertOk();                                   // same key: the same gift
        $this->report(['idempotency_key' => 'key-2'])->assertStatus(409); // same M-Pesa code
        $this->assertSame(1, MpesaPayment::count());
    }

    public function test_it_rejects_an_unknown_invite_and_a_malformed_code(): void
    {
        $this->guest();
        $this->report(['guest_code' => 'NOPE'])->assertNotFound();
        $this->report(['receipt' => 'abc'])->assertStatus(422);
        $this->assertSame(0, MpesaPayment::count());
    }

    public function test_guests_only_see_their_own_gifts(): void
    {
        $this->guest();
        $this->guest('AMINA1', 'Amina Odhiambo');
        $this->report()->assertCreated();
        $this->report(['guest_code' => 'AMINA1', 'receipt' => 'TKD4ABC99Z', 'idempotency_key' => 'key-3', 'giver_name' => 'Amina', 'amount' => 500])->assertCreated();

        $this->getJson('/api/gifts/mpesa/mine?guest_code=GRACE26')
            ->assertOk()
            ->assertJsonCount(1, 'data.gifts')
            ->assertJsonPath('data.gifts.0.amount', 2000);

        $this->getJson('/api/gifts/mpesa/mine?guest_code=UNKNOWN')->assertOk()->assertJsonCount(0, 'data.gifts');
    }

    public function test_the_couple_see_reported_gifts_with_totals(): void
    {
        $this->guest();
        $this->report()->assertCreated();

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson('/api/gifts/mpesa-payments')
            ->assertOk()
            ->assertJsonPath('data.summary.reported_total', 2000)
            ->assertJsonPath('data.summary.reported_count', 1)
            ->assertJsonPath('data.payments.0.method', 'paybill');
    }

    public function test_public_settings_include_who_the_paybill_pays(): void
    {
        Setting::updateOrCreate(['key' => 'mpesa_paybill_name'], ['value' => 'Dinah Achieng Tambo']);
        Setting::updateOrCreate(['key' => 'mpesa_paybill_bank'], ['value' => 'Standard Chartered']);

        $this->getJson('/api/public/settings')
            ->assertOk()
            ->assertJsonPath('data.mpesa_paybill_name', 'Dinah Achieng Tambo')
            ->assertJsonPath('data.mpesa_paybill_bank', 'Standard Chartered');
    }
}
