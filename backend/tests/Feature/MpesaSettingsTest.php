<?php

namespace Tests\Feature;

use App\Models\IntegrationCredential;
use App\Models\Setting;
use App\Models\User;
use App\Services\MpesaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Owners connect M-Pesa from the admin: keys are stored encrypted, never
 * returned, and used in place of the server .env values.
 */
class MpesaSettingsTest extends TestCase
{
    use RefreshDatabase;

    private const KEYS = [
        'env' => 'production',
        'shortcode' => '4123456',
        'transaction_type' => 'CustomerPayBillOnline',
        'consumer_key' => 'live-consumer-key',
        'consumer_secret' => 'live-consumer-secret',
        'passkey' => 'live-passkey-value',
        'callback_base_url' => 'https://api.example.test',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config([
            'mpesa.env' => 'sandbox',
            'mpesa.base_url' => 'https://sandbox.safaricom.co.ke',
            'mpesa.consumer_key' => null,
            'mpesa.consumer_secret' => null,
            'mpesa.shortcode' => null,
            'mpesa.passkey' => null,
            'mpesa.callback_token' => null,
            'mpesa.callback_base_url' => 'https://api.example.test',
        ]);
        MpesaService::applyStoredCredentials(true);
    }

    private function owner(): User
    {
        return User::factory()->create(['role' => User::ROLE_OWNER]);
    }

    public function test_only_owners_can_see_or_change_the_keys(): void
    {
        $this->getJson('/api/gifts/mpesa-settings')->assertUnauthorized();

        $editor = User::factory()->create(['role' => User::ROLE_EDITOR]);
        $this->actingAs($editor, 'sanctum')->getJson('/api/gifts/mpesa-settings')->assertForbidden();
        $this->actingAs($editor, 'sanctum')->putJson('/api/gifts/mpesa-settings', self::KEYS)->assertForbidden();
        $this->assertDatabaseCount('integration_credentials', 0);
    }

    public function test_owner_saves_keys_encrypted_and_they_are_never_returned(): void
    {
        $response = $this->actingAs($this->owner(), 'sanctum')
            ->putJson('/api/gifts/mpesa-settings', self::KEYS)
            ->assertOk()
            ->assertJsonPath('data.configured', true)
            ->assertJsonPath('data.source', 'dashboard')
            ->assertJsonPath('data.env', 'production')
            ->assertJsonPath('data.shortcode', '4123456')
            ->assertJsonPath('data.has_passkey', true);

        foreach (['live-consumer-key', 'live-consumer-secret', 'live-passkey-value'] as $secret) {
            $this->assertStringNotContainsString($secret, $response->getContent());
        }

        // Encrypted at rest, and nowhere in the settings every admin can read.
        $raw = DB::table('integration_credentials')->value('payload');
        $this->assertStringNotContainsString('live-passkey-value', $raw);
        $this->assertSame(0, Setting::where('value', 'like', '%live-%')->count());
        $this->assertSame('live-passkey-value', IntegrationCredential::payloadFor('mpesa')['passkey']);
        $this->assertNotEmpty(IntegrationCredential::payloadFor('mpesa')['callback_token']);

        $this->getJson('/api/gifts/mpesa-settings')->assertOk()->assertJsonMissing(['passkey' => 'live-passkey-value']);
    }

    public function test_saved_keys_drive_the_stk_push_in_a_new_request(): void
    {
        $this->actingAs($this->owner(), 'sanctum')->putJson('/api/gifts/mpesa-settings', self::KEYS)->assertOk();

        // A fresh request: nothing from .env, everything from the admin.
        config(['mpesa.env' => 'sandbox', 'mpesa.base_url' => 'https://sandbox.safaricom.co.ke', 'mpesa.consumer_key' => null]);
        MpesaService::applyStoredCredentials(true);

        Http::fake([
            'api.safaricom.co.ke/oauth/*' => Http::response(['access_token' => 'live-token', 'expires_in' => '3599']),
            'api.safaricom.co.ke/mpesa/stkpush/*' => Http::response([
                'MerchantRequestID' => 'm-1', 'CheckoutRequestID' => 'ws_CO_live', 'ResponseCode' => '0', 'CustomerMessage' => 'ok',
            ]),
        ]);

        $this->postJson('/api/gifts/mpesa', [
            'amount' => 1000, 'phone' => '0712345678', 'giver_name' => 'Amina', 'idempotency_key' => 'key-1',
        ])->assertCreated();

        Http::assertSent(fn ($request) => str_starts_with($request->url(), 'https://api.safaricom.co.ke/mpesa/stkpush')
            && $request['BusinessShortCode'] === '4123456'
            && str_contains($request['CallBackURL'], 'https://api.example.test/api/mpesa/callback/'));
    }

    public function test_blank_secret_fields_keep_the_saved_ones(): void
    {
        $owner = $this->owner();
        $this->actingAs($owner, 'sanctum')->putJson('/api/gifts/mpesa-settings', self::KEYS)->assertOk();
        $this->actingAs($owner, 'sanctum')->putJson('/api/gifts/mpesa-settings', [
            ...self::KEYS, 'env' => 'sandbox', 'consumer_key' => '', 'consumer_secret' => '', 'passkey' => '',
        ])->assertOk()->assertJsonPath('data.env', 'sandbox');

        $payload = IntegrationCredential::payloadFor('mpesa');
        $this->assertSame('live-consumer-key', $payload['consumer_key']);
        $this->assertSame('sandbox', $payload['env']);
    }

    public function test_bad_numbers_get_a_plain_message(): void
    {
        $this->actingAs($this->owner(), 'sanctum')
            ->putJson('/api/gifts/mpesa-settings', [...self::KEYS, 'shortcode' => 'abc'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('shortcode');
    }

    public function test_connection_check_reports_whether_safaricom_accepts_the_keys(): void
    {
        $owner = $this->owner();
        $this->actingAs($owner, 'sanctum')->postJson('/api/gifts/mpesa-settings/test')->assertStatus(422);

        $this->actingAs($owner, 'sanctum')->putJson('/api/gifts/mpesa-settings', self::KEYS)->assertOk();

        Http::fake(['*/oauth/*' => Http::sequence()
            ->push(['errorMessage' => 'Invalid credentials'], 400)
            ->push(['access_token' => 'ok', 'expires_in' => '3599'])]);
        $this->actingAs($owner, 'sanctum')->postJson('/api/gifts/mpesa-settings/test')
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->actingAs($owner, 'sanctum')->postJson('/api/gifts/mpesa-settings/test')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_owner_can_remove_the_saved_keys(): void
    {
        $owner = $this->owner();
        $this->actingAs($owner, 'sanctum')->putJson('/api/gifts/mpesa-settings', self::KEYS)->assertOk();
        $this->actingAs($owner, 'sanctum')->deleteJson('/api/gifts/mpesa-settings')->assertOk();
        $this->assertDatabaseCount('integration_credentials', 0);
    }
}
