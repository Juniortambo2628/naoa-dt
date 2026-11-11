<?php

namespace Tests\Feature;

use App\Models\Gift;
use App\Models\GiftClaim;
use App\Models\Guest;
use App\Models\MpesaPayment;
use App\Models\Setting;
use App\Models\User;
use App\Services\MpesaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class MpesaTest extends TestCase
{
    use RefreshDatabase;

    private const TOKEN = 'callback-secret-token';

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Cache::flush();

        config([
            'mpesa.env' => 'sandbox',
            'mpesa.base_url' => 'https://sandbox.safaricom.co.ke',
            'mpesa.consumer_key' => 'consumer-key',
            'mpesa.consumer_secret' => 'consumer-secret',
            'mpesa.shortcode' => '174379',
            'mpesa.passkey' => 'test-passkey',
            'mpesa.callback_base_url' => 'https://api.example.test',
            'mpesa.callback_token' => self::TOKEN,
        ]);
    }

    private function fakeDaraja(array $stk = null, array $query = null): void
    {
        Http::fake([
            '*/oauth/v1/generate*' => Http::response(['access_token' => 'access-token', 'expires_in' => '3599']),
            // Like Safaricom, a fresh CheckoutRequestID for every prompt.
            '*/mpesa/stkpush/v1/processrequest' => fn () => Http::response($stk ?? [
                'MerchantRequestID' => 'merchant-'.Str::random(6),
                'CheckoutRequestID' => 'ws_CO_'.Str::random(12),
                'ResponseCode' => '0',
                'ResponseDescription' => 'Success. Request accepted for processing',
                'CustomerMessage' => 'Success. Request accepted for processing',
            ]),
            '*/mpesa/stkpushquery/v1/query' => Http::response($query ?? [
                'errorCode' => '500.001.1001', 'errorMessage' => 'The transaction is being processed',
            ], $query ? 200 : 500),
        ]);
    }

    private function initiate(array $overrides = []): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/gifts/mpesa', array_merge([
            'amount' => 1000,
            'phone' => '0712 345 678',
            'giver_name' => 'Aunt Rhoda',
            'idempotency_key' => (string) Str::uuid(),
        ], $overrides));
    }

    private function sendCallback(MpesaPayment $payment, int $resultCode = 0, array $metadata = null, string $token = self::TOKEN)
    {
        $metadata ??= [
            ['Name' => 'Amount', 'Value' => $payment->amount],
            ['Name' => 'MpesaReceiptNumber', 'Value' => 'TKB1234XYZ'],
            ['Name' => 'TransactionDate', 'Value' => 20261114153045],
            ['Name' => 'PhoneNumber', 'Value' => 254712345678],
        ];

        // (drop only nulls: ResultCode 0 must stay in the payload)
        $body = ['Body' => ['stkCallback' => array_filter([
            'MerchantRequestID' => $payment->merchant_request_id,
            'CheckoutRequestID' => $payment->checkout_request_id,
            'ResultCode' => $resultCode,
            'ResultDesc' => $resultCode === 0 ? 'The service request is processed successfully.' : 'Request cancelled by user',
            'CallbackMetadata' => $resultCode === 0 ? ['Item' => $metadata] : null,
        ], fn ($v) => $v !== null)]];

        return $this->postJson("/api/mpesa/callback/$token", $body);
    }

    // ---- Phone numbers ------------------------------------------------------

    public function test_phone_numbers_are_normalised_the_ways_people_type_them(): void
    {
        foreach (['0712345678', '0712 345 678', '+254 712 345 678', '254712345678', '712345678', '0712-345-678'] as $input) {
            $this->assertSame('254712345678', MpesaService::normalizePhone($input), $input);
        }
        $this->assertSame('254110345678', MpesaService::normalizePhone('0110 345 678'));
        foreach (['', '12345', '0812345678', '+1 905 531 2912', 'abc'] as $bad) {
            $this->assertNull(MpesaService::normalizePhone($bad), $bad);
        }
    }

    // ---- Starting a gift ----------------------------------------------------

    public function test_guest_can_send_a_gift_prompt_linked_to_their_invite(): void
    {
        $this->fakeDaraja();
        $guest = Guest::factory()->create(['unique_code' => 'LOVE2026', 'name' => 'Rhoda Ouko']);

        $response = $this->initiate(['guest_code' => 'love2026', 'message' => 'Congratulations!'])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.amount', 1000);

        // The browser only ever sees the public id, never the phone number.
        $this->assertArrayNotHasKey('phone', $response->json('data'));

        $payment = MpesaPayment::firstOrFail();
        $this->assertSame($guest->id, $payment->guest_id);
        $this->assertSame('254712345678', $payment->phone);
        $this->assertSame('LOVE2026', $payment->account_reference);
        $this->assertNotNull($payment->checkout_request_id);

        Http::assertSent(fn (HttpRequest $r) => str_contains($r->url(), 'stkpush')
            && $r['BusinessShortCode'] === '174379'
            && $r['PhoneNumber'] === '254712345678'
            && $r['Amount'] === 1000
            && $r['AccountReference'] === 'LOVE2026'
            && $r['TransactionType'] === 'CustomerPayBillOnline'
            && $r['CallBackURL'] === 'https://api.example.test/api/mpesa/callback/'.self::TOKEN
            && $r['Password'] === base64_encode('174379test-passkey'.$r['Timestamp']));
    }

    public function test_gift_on_behalf_of_someone_else_keeps_their_name(): void
    {
        $this->fakeDaraja();
        $guest = Guest::factory()->create(['unique_code' => 'FAMILY01']);

        $this->initiate(['guest_code' => 'FAMILY01', 'giver_name' => 'Grandma Achieng', 'on_behalf' => true])->assertCreated();
        $payment = MpesaPayment::firstOrFail();
        $this->sendCallback($payment)->assertOk();

        $claim = GiftClaim::firstOrFail();
        $this->assertSame('Grandma Achieng', $claim->claimer_name);
        $this->assertSame($guest->id, $claim->guest_id); // still traced to the invite it came from
        $this->assertTrue($payment->fresh()->on_behalf);
    }

    public function test_invalid_phone_number_is_rejected_with_a_plain_message(): void
    {
        $this->fakeDaraja();

        $this->initiate(['phone' => '12345'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Please enter a Safaricom number like 0712 345 678.');

        Http::assertNothingSent();
    }

    public function test_amount_below_minimum_is_rejected(): void
    {
        $this->fakeDaraja();
        $this->initiate(['amount' => 5])->assertStatus(422);
        $this->assertSame(0, MpesaPayment::count());
    }

    public function test_unavailable_when_not_configured_or_switched_off(): void
    {
        $this->fakeDaraja();

        config(['mpesa.passkey' => null]);
        $this->initiate()->assertStatus(503);

        config(['mpesa.passkey' => 'test-passkey']);
        Setting::create(['key' => 'mpesa_enabled', 'value' => 'false']);
        $this->initiate()->assertStatus(503);

        Http::assertNothingSent();
    }

    public function test_double_tapped_send_creates_one_prompt(): void
    {
        $this->fakeDaraja();
        $key = (string) Str::uuid();

        $first = $this->initiate(['idempotency_key' => $key])->assertCreated();
        $second = $this->initiate(['idempotency_key' => $key])->assertOk();

        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertSame(1, MpesaPayment::count());
        Http::assertSentCount(2); // one token + one STK push
    }

    public function test_second_prompt_to_the_same_phone_while_one_is_waiting_is_refused(): void
    {
        $this->fakeDaraja();
        $first = $this->initiate()->assertCreated();

        $this->initiate(['phone' => '+254712345678'])
            ->assertStatus(409)
            ->assertJsonPath('errors.payment.id', $first->json('data.id'));

        $this->assertSame(1, MpesaPayment::count());
    }

    public function test_many_guests_sending_at_once_each_get_their_own_prompt(): void
    {
        $this->fakeDaraja();

        foreach (range(1, 25) as $i) {
            $this->initiate(['phone' => sprintf('07%08d', $i), 'giver_name' => "Guest $i"])->assertCreated();
        }

        $this->assertSame(25, MpesaPayment::count());
        // One OAuth token is fetched and reused, not one per guest.
        Http::assertSentCount(26);
    }

    public function test_rejected_push_marks_payment_failed_and_explains(): void
    {
        $this->fakeDaraja(['requestId' => 'x', 'errorCode' => '400.002.02', 'errorMessage' => 'Bad Request - Invalid PhoneNumber']);

        $this->initiate()
            ->assertStatus(502)
            ->assertJsonPath('errors.payment.status', 'failed');

        $this->assertSame(MpesaPayment::STATUS_FAILED, MpesaPayment::firstOrFail()->status);
    }

    // ---- Safaricom's confirmation --------------------------------------------

    public function test_successful_callback_records_the_gift_once(): void
    {
        $this->fakeDaraja();
        $guest = Guest::factory()->create(['unique_code' => 'LOVE2026']);
        $this->initiate(['guest_code' => 'LOVE2026', 'message' => 'Congrats'])->assertCreated();
        $payment = MpesaPayment::firstOrFail();

        $this->sendCallback($payment)->assertOk()->assertJson(['ResultCode' => 0]);
        // Safaricom retries callbacks; a repeat must not double-count.
        $this->sendCallback($payment)->assertOk();

        $payment->refresh();
        $this->assertSame(MpesaPayment::STATUS_SUCCESS, $payment->status);
        $this->assertSame('TKB1234XYZ', $payment->mpesa_receipt);

        $this->assertSame(1, GiftClaim::count());
        $claim = GiftClaim::firstOrFail();
        $this->assertSame(1000.0, (float) $claim->amount);
        $this->assertSame('Aunt Rhoda', $claim->claimer_name);
        $this->assertSame($guest->id, $claim->guest_id);
        $this->assertSame('mpesa', $claim->payment_method);
        $this->assertSame('TKB1234XYZ', $claim->payment_reference);
        $this->assertSame('Congrats', $claim->message);

        // It lands in the registry's cash fund (created if none existed).
        $this->assertTrue($claim->gift->is_cash_fund);
        $this->assertSame(1000.0, (float) $claim->gift->total_contributions);
    }

    public function test_gift_goes_to_the_existing_cash_fund(): void
    {
        $this->fakeDaraja();
        $fund = Gift::factory()->cashFund()->create();
        $this->initiate()->assertCreated();

        $this->sendCallback(MpesaPayment::firstOrFail())->assertOk();

        $this->assertSame($fund->id, GiftClaim::firstOrFail()->gift_id);
        $this->assertSame(1, Gift::count());
    }

    public function test_cancelled_prompt_records_no_gift(): void
    {
        $this->fakeDaraja();
        $this->initiate()->assertCreated();
        $payment = MpesaPayment::firstOrFail();

        $this->sendCallback($payment, 1032)->assertOk();

        $this->assertSame(MpesaPayment::STATUS_CANCELLED, $payment->fresh()->status);
        $this->assertSame(0, GiftClaim::count());
        $this->getJson("/api/gifts/mpesa/{$payment->public_id}")
            ->assertJsonPath('data.message', 'The M-Pesa request was cancelled on the phone. No money was taken.');
    }

    public function test_callback_with_wrong_token_is_ignored(): void
    {
        $this->fakeDaraja();
        $this->initiate()->assertCreated();
        $payment = MpesaPayment::firstOrFail();

        $this->sendCallback($payment, 0, null, 'guessed-token')->assertNotFound();

        $this->assertTrue($payment->fresh()->isPending());
        $this->assertSame(0, GiftClaim::count());
    }

    public function test_callback_with_a_different_amount_is_not_recorded(): void
    {
        $this->fakeDaraja();
        $this->initiate()->assertCreated();
        $payment = MpesaPayment::firstOrFail();

        $this->sendCallback($payment, 0, [
            ['Name' => 'Amount', 'Value' => 1],
            ['Name' => 'MpesaReceiptNumber', 'Value' => 'FAKE'],
        ])->assertOk();

        $this->assertSame(MpesaPayment::STATUS_FAILED, $payment->fresh()->status);
        $this->assertSame(0, GiftClaim::count());
    }

    public function test_callback_for_an_unknown_payment_is_acknowledged_and_ignored(): void
    {
        $this->postJson('/api/mpesa/callback/'.self::TOKEN, ['Body' => ['stkCallback' => [
            'CheckoutRequestID' => 'ws_CO_unknown', 'ResultCode' => 0,
        ]]])->assertOk()->assertJson(['ResultCode' => 0]);

        $this->assertSame(0, GiftClaim::count());
    }

    // ---- When the confirmation never arrives -------------------------------

    public function test_status_check_asks_safaricom_when_no_callback_arrives(): void
    {
        $this->fakeDaraja(null, ['ResponseCode' => '0', 'ResultCode' => '0', 'ResultDesc' => 'The service request is processed successfully.']);
        $this->initiate()->assertCreated();
        $payment = MpesaPayment::firstOrFail();

        // Too early: no query yet.
        $this->getJson("/api/gifts/mpesa/{$payment->public_id}")->assertJsonPath('data.status', 'pending');
        Http::assertNotSent(fn (HttpRequest $r) => str_contains($r->url(), 'stkpushquery'));

        $this->travel(30)->seconds();
        $this->getJson("/api/gifts/mpesa/{$payment->public_id}")
            ->assertJsonPath('data.status', 'success')
            ->assertJsonPath('data.message', 'Thank you! Your gift has been received.');

        $this->assertSame(1, GiftClaim::count());

        // The callback arriving afterwards adds the receipt, not a second gift.
        $this->sendCallback($payment->fresh())->assertOk();
        $this->assertSame(1, GiftClaim::count());
        $this->assertSame('TKB1234XYZ', GiftClaim::firstOrFail()->payment_reference);
    }

    public function test_reconcile_command_resolves_payments_without_a_callback(): void
    {
        $this->fakeDaraja(null, ['ResponseCode' => '0', 'ResultCode' => '1032', 'ResultDesc' => 'Request cancelled by user']);
        $this->initiate()->assertCreated();
        $payment = MpesaPayment::firstOrFail();

        $this->travel(2)->minutes();
        $this->artisan('mpesa:reconcile')->assertSuccessful();

        $this->assertSame(MpesaPayment::STATUS_CANCELLED, $payment->fresh()->status);
    }

    public function test_reconcile_times_out_prompts_safaricom_cannot_answer_and_a_late_success_still_counts(): void
    {
        $this->fakeDaraja(); // query keeps answering "still processing"
        $this->initiate()->assertCreated();
        $payment = MpesaPayment::firstOrFail();

        $this->travel(6)->minutes();
        $this->artisan('mpesa:reconcile')->assertSuccessful();
        $this->assertSame(MpesaPayment::STATUS_TIMEOUT, $payment->fresh()->status);

        // The money did move after all: Safaricom's late confirmation wins.
        $this->sendCallback($payment->fresh())->assertOk();
        $this->assertSame(MpesaPayment::STATUS_SUCCESS, $payment->fresh()->status);
        $this->assertSame(1, GiftClaim::count());
    }

    // ---- Settings and admin ------------------------------------------------

    public function test_public_settings_say_whether_mpesa_is_available_without_leaking_keys(): void
    {
        Setting::create(['key' => 'mpesa_paybill_number', 'value' => '123456']);

        $response = $this->getJson('/api/public/settings')->assertOk();
        $this->assertTrue($response->json('data.mpesa_stk_enabled'));
        $this->assertSame('123456', $response->json('data.mpesa_paybill_number'));

        foreach (['consumer-key', 'consumer-secret', 'test-passkey', self::TOKEN] as $secret) {
            $this->assertStringNotContainsString($secret, $response->getContent());
        }

        config(['mpesa.consumer_key' => null]);
        $this->assertFalse($this->getJson('/api/public/settings')->json('data.mpesa_stk_enabled'));
    }

    public function test_admin_sees_every_attempt_and_the_total_received(): void
    {
        $this->fakeDaraja();
        $this->initiate()->assertCreated();
        $this->sendCallback(MpesaPayment::firstOrFail())->assertOk();
        $this->initiate(['phone' => '0722000000', 'amount' => 500])->assertCreated();

        $this->getJson('/api/gifts/mpesa-payments')->assertUnauthorized();

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson('/api/gifts/mpesa-payments')
            ->assertOk()
            ->assertJsonPath('data.summary.received_total', 1000)
            ->assertJsonPath('data.summary.received_count', 1)
            ->assertJsonPath('data.summary.pending_count', 1)
            ->assertJsonCount(2, 'data.payments');
    }
}
