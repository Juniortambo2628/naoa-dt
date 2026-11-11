<?php

namespace App\Services;

use App\Models\IntegrationCredential;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Thin client for Safaricom's Daraja API: Lipa Na M-Pesa Online (STK Push).
 *
 * - accessToken(): OAuth token, cached until shortly before it expires and
 *   fetched under a lock, so a rush of simultaneous gifts makes one token
 *   request rather than one each.
 * - stkPush(): sends the "enter your PIN" prompt to the guest's phone.
 * - stkQuery(): asks Safaricom for the outcome of a prompt whose callback
 *   never arrived (used by the mpesa:reconcile command and status polling).
 */
class MpesaService
{
    private const TOKEN_CACHE_KEY = 'mpesa:access_token';

    /** Daraja's "still waiting for the customer" error code on STK Query. */
    private const STILL_PROCESSING = '500.001.1001';

    /** Name of the encrypted credentials row an owner fills in the admin. */
    public const CREDENTIAL_NAME = 'mpesa';

    /** Keys an owner may set from the admin (Gifts → M-Pesa gifts → Connect). */
    public const DASHBOARD_KEYS = [
        'env', 'consumer_key', 'consumer_secret', 'shortcode', 'passkey',
        'transaction_type', 'till_number', 'callback_token', 'callback_base_url',
    ];

    /** Whether the keys in use came from the admin rather than the server .env. */
    private static ?bool $fromDashboard = null;

    public function __construct()
    {
        self::applyStoredCredentials();
    }

    /**
     * Overlay the credentials saved in the admin on config('mpesa'), so the
     * couple can connect M-Pesa without editing the server's .env. Values
     * saved in the admin win; anything left blank falls back to .env.
     */
    public static function applyStoredCredentials(bool $fresh = false): void
    {
        if (self::$fromDashboard !== null && ! $fresh) {
            return;
        }

        try {
            $stored = IntegrationCredential::payloadFor(self::CREDENTIAL_NAME);
        } catch (\Throwable) {
            $stored = []; // table not migrated yet, or APP_KEY changed
        }

        $overrides = [];
        foreach (self::DASHBOARD_KEYS as $key) {
            if (filled($stored[$key] ?? null)) {
                $overrides["mpesa.$key"] = $stored[$key];
            }
        }
        if (isset($overrides['mpesa.env'])) {
            $overrides['mpesa.base_url'] = $overrides['mpesa.env'] === 'production'
                ? 'https://api.safaricom.co.ke'
                : 'https://sandbox.safaricom.co.ke';
        }

        config($overrides);
        self::$fromDashboard = filled($stored['consumer_key'] ?? null);
    }

    public static function credentialsFromDashboard(): bool
    {
        self::applyStoredCredentials();

        return (bool) self::$fromDashboard;
    }

    /** Forget the cached token, e.g. after the keys change. */
    public static function forgetToken(): void
    {
        Cache::forget(self::TOKEN_CACHE_KEY);
    }

    public function isConfigured(): bool
    {
        foreach (['consumer_key', 'consumer_secret', 'shortcode', 'passkey', 'callback_token', 'callback_base_url'] as $key) {
            if (blank(config("mpesa.$key"))) {
                return false;
            }
        }

        return true;
    }

    /**
     * Normalise a Kenyan mobile number to 2547XXXXXXXX / 2541XXXXXXXX.
     * Accepts "0712 345 678", "+254712345678", "712345678", "254712345678".
     * Returns null for anything that is not a Kenyan mobile number.
     */
    public static function normalizePhone(?string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone);

        if (preg_match('/^0([71]\d{8})$/', $digits, $m)) {
            $digits = '254'.$m[1];
        } elseif (preg_match('/^([71]\d{8})$/', $digits, $m)) {
            $digits = '254'.$m[1];
        }

        return preg_match('/^254[71]\d{8}$/', $digits) ? $digits : null;
    }

    /** Daraja AccountReference: max 12 alphanumeric characters. */
    public static function accountReference(?string $value): string
    {
        $clean = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) $value));

        return substr($clean !== '' ? $clean : (string) config('mpesa.default_account_reference', 'WEDDING'), 0, 12);
    }

    public function callbackUrl(): string
    {
        return rtrim((string) config('mpesa.callback_base_url'), '/')
            .'/api/mpesa/callback/'.config('mpesa.callback_token');
    }

    public function accessToken(): string
    {
        $cached = Cache::get(self::TOKEN_CACHE_KEY);
        if ($cached) {
            return $cached;
        }

        // Only one request fetches a fresh token; the others wait briefly and
        // then read it from the cache.
        return Cache::lock('mpesa:access_token_lock', 15)->block(10, function () {
            $cached = Cache::get(self::TOKEN_CACHE_KEY);
            if ($cached) {
                return $cached;
            }

            $response = Http::timeout((int) config('mpesa.http_timeout', 20))
                ->withBasicAuth((string) config('mpesa.consumer_key'), (string) config('mpesa.consumer_secret'))
                ->get(config('mpesa.base_url').'/oauth/v1/generate', ['grant_type' => 'client_credentials']);

            $token = $response->json('access_token');
            if (! $response->successful() || ! $token) {
                Log::error('M-Pesa token request failed', ['status' => $response->status(), 'body' => $response->body()]);
                throw new RuntimeException('Could not connect to M-Pesa right now.');
            }

            $ttl = max(60, ((int) $response->json('expires_in', 3599)) - 120);
            Cache::put(self::TOKEN_CACHE_KEY, $token, $ttl);

            return $token;
        });
    }

    /**
     * Send the STK Push prompt. Returns Daraja's response
     * (MerchantRequestID, CheckoutRequestID, ResponseCode, CustomerMessage).
     *
     * @throws RuntimeException with a guest-friendly message when Safaricom
     *                          rejects the request or cannot be reached.
     */
    public function stkPush(string $phone, int $amount, string $accountReference, ?string $description = null): array
    {
        [$timestamp, $password] = $this->credentials();
        $shortcode = (string) config('mpesa.shortcode');
        $isTill = config('mpesa.transaction_type') === 'CustomerBuyGoodsOnline';

        $payload = [
            'BusinessShortCode' => $shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => config('mpesa.transaction_type'),
            'Amount' => $amount,
            'PartyA' => $phone,
            'PartyB' => $isTill && config('mpesa.till_number') ? (string) config('mpesa.till_number') : $shortcode,
            'PhoneNumber' => $phone,
            'CallBackURL' => $this->callbackUrl(),
            'AccountReference' => self::accountReference($accountReference),
            'TransactionDesc' => substr($description ?: (string) config('mpesa.transaction_desc'), 0, 13),
        ];

        try {
            $response = $this->authorised()->post(config('mpesa.base_url').'/mpesa/stkpush/v1/processrequest', $payload);
        } catch (RuntimeException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::warning('M-Pesa STK push unreachable', ['error' => $e->getMessage()]);
            throw new RuntimeException('Could not connect to M-Pesa right now. Please try again in a moment.');
        }
        $body = $response->json() ?? [];

        if (! $response->successful() || (string) ($body['ResponseCode'] ?? '') !== '0' || empty($body['CheckoutRequestID'])) {
            Log::warning('M-Pesa STK push rejected', ['status' => $response->status(), 'body' => $body]);
            throw new RuntimeException(
                'M-Pesa could not send the payment request. Please check the phone number and try again.'
            );
        }

        return $body;
    }

    /**
     * Ask Safaricom for the outcome of a prompt.
     *
     * @return array{pending: bool, result_code: ?string, result_desc: ?string}|null
     *                                                                               null when Safaricom could not be reached (try again later).
     */
    public function stkQuery(string $checkoutRequestId): ?array
    {
        [$timestamp, $password] = $this->credentials();

        try {
            $response = $this->authorised()->post(config('mpesa.base_url').'/mpesa/stkpushquery/v1/query', [
                'BusinessShortCode' => (string) config('mpesa.shortcode'),
                'Password' => $password,
                'Timestamp' => $timestamp,
                'CheckoutRequestID' => $checkoutRequestId,
            ]);
        } catch (\Throwable $e) {
            Log::warning('M-Pesa STK query failed', ['error' => $e->getMessage()]);

            return null;
        }

        $body = $response->json() ?? [];

        if (($body['errorCode'] ?? null) === self::STILL_PROCESSING) {
            return ['pending' => true, 'result_code' => null, 'result_desc' => null];
        }

        if (! array_key_exists('ResultCode', $body)) {
            return null;
        }

        return [
            'pending' => false,
            'result_code' => (string) $body['ResultCode'],
            'result_desc' => $body['ResultDesc'] ?? null,
        ];
    }

    /** @return array{0: string, 1: string} [timestamp, password] */
    private function credentials(): array
    {
        $timestamp = now('Africa/Nairobi')->format('YmdHis');
        $password = base64_encode(config('mpesa.shortcode').config('mpesa.passkey').$timestamp);

        return [$timestamp, $password];
    }

    private function authorised(): \Illuminate\Http\Client\PendingRequest
    {
        return Http::timeout((int) config('mpesa.http_timeout', 20))
            ->acceptJson()
            ->withToken($this->accessToken());
    }
}
