<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IntegrationCredential;
use App\Services\MpesaService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Owner-only: connect M-Pesa from the admin (Gifts → M-Pesa gifts → Connect).
 *
 * The Daraja keys are stored encrypted (IntegrationCredential) and are never
 * returned: the browser only learns whether each one has been saved.
 */
class MpesaSettingsController extends Controller
{
    use ApiResponse;

    private const SECRET_KEYS = ['consumer_key', 'consumer_secret', 'passkey'];

    public function show(MpesaService $mpesa): JsonResponse
    {
        return $this->successResponse($this->summary($mpesa));
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'env' => 'required|in:sandbox,production',
            'shortcode' => ['required', 'regex:/^\d{5,8}$/'],
            'transaction_type' => 'required|in:CustomerPayBillOnline,CustomerBuyGoodsOnline',
            'till_number' => ['nullable', 'regex:/^\d{5,8}$/'],
            'consumer_key' => 'nullable|string|max:255',
            'consumer_secret' => 'nullable|string|max:255',
            'passkey' => 'nullable|string|max:255',
            'callback_base_url' => 'nullable|url:https|max:255',
        ], [
            'shortcode.regex' => 'Enter the Pay Bill (or Till) number: digits only.',
            'till_number.regex' => 'Enter the Till number: digits only.',
            'callback_base_url.url' => 'Enter the API address starting with https://',
        ]);

        $record = IntegrationCredential::firstOrNew(['name' => MpesaService::CREDENTIAL_NAME]);
        $payload = $record->exists ? ($record->payload ?? []) : [];

        foreach (['env', 'shortcode', 'transaction_type'] as $key) {
            $payload[$key] = trim($data[$key]);
        }
        $payload['till_number'] = $data['transaction_type'] === 'CustomerBuyGoodsOnline'
            ? trim((string) ($data['till_number'] ?? ''))
            : '';
        $payload['callback_base_url'] = rtrim(trim((string) ($data['callback_base_url'] ?? '')), '/');

        // Secrets: a blank field keeps what was saved before.
        foreach (self::SECRET_KEYS as $key) {
            $value = trim((string) ($data[$key] ?? ''));
            if ($value !== '') {
                $payload[$key] = $value;
            }
        }

        // The callback address carries a random token so only Safaricom,
        // who is given the address, can confirm payments.
        $payload['callback_token'] ??= Str::random(48);

        $record->payload = $payload;
        $record->updated_by = $request->user()?->id;
        $record->save();

        MpesaService::forgetToken();
        MpesaService::applyStoredCredentials(true);

        return $this->successResponse($this->summary(app(MpesaService::class)), 'M-Pesa details saved');
    }

    /** Ask Safaricom for an access token with the saved keys. */
    public function test(MpesaService $mpesa): JsonResponse
    {
        if (! $mpesa->isConfigured()) {
            return $this->errorResponse('Fill in and save all the M-Pesa details first.', 422);
        }

        MpesaService::forgetToken();
        try {
            $mpesa->accessToken();
        } catch (RuntimeException) {
            return $this->errorResponse(
                'Safaricom did not accept these keys. Check the Consumer Key and Secret, and that Test/Live matches the app on Daraja.',
                422
            );
        }

        return $this->successResponse(
            $this->summary($mpesa),
            config('mpesa.env') === 'production'
                ? 'Connected to Safaricom (live). Guests can now get the M-Pesa prompt.'
                : 'Connected to the Safaricom sandbox (test mode — no real money moves).'
        );
    }

    /** Forget the keys saved in the admin (falls back to the server .env, if any). */
    public function destroy(): JsonResponse
    {
        IntegrationCredential::where('name', MpesaService::CREDENTIAL_NAME)->delete();
        MpesaService::forgetToken();

        return $this->successResponse(null, 'M-Pesa details removed');
    }

    private function summary(MpesaService $mpesa): array
    {
        $stored = IntegrationCredential::payloadFor(MpesaService::CREDENTIAL_NAME);

        return [
            'configured' => $mpesa->isConfigured(),
            'source' => MpesaService::credentialsFromDashboard() ? 'dashboard' : ($mpesa->isConfigured() ? 'server' : 'none'),
            'env' => config('mpesa.env'),
            'shortcode' => (string) config('mpesa.shortcode'),
            'transaction_type' => config('mpesa.transaction_type'),
            'till_number' => (string) config('mpesa.till_number'),
            'callback_base_url' => $stored['callback_base_url'] ?? '',
            'default_callback_base_url' => rtrim((string) config('mpesa.default_callback_base_url'), '/'),
            'has_consumer_key' => filled(config('mpesa.consumer_key')),
            'has_consumer_secret' => filled(config('mpesa.consumer_secret')),
            'has_passkey' => filled(config('mpesa.passkey')),
        ];
    }
}
