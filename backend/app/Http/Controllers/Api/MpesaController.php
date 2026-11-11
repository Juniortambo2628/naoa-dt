<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Gift;
use App\Models\Guest;
use App\Models\MpesaPayment;
use App\Models\Setting;
use App\Services\MpesaPaymentRecorder;
use App\Services\MpesaService;
use App\Traits\ApiResponse;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Cash gifts by M-Pesa STK Push from the digital invitation.
 *
 * Flow: the guest taps "Send gift" -> initiate() records a pending payment and
 * asks Safaricom to show the PIN prompt on their phone -> the page polls
 * status() -> Safaricom calls callback() with the outcome (status() and the
 * mpesa:reconcile command ask Safaricom directly if that never arrives).
 */
class MpesaController extends Controller
{
    use ApiResponse;

    /** A second prompt to the same phone within this window is refused. */
    private const IN_FLIGHT_SECONDS = 60;

    /** Wait this long after sending before asking Safaricom for the result. */
    private const QUERY_AFTER_SECONDS = 25;

    public function __construct(
        private readonly MpesaService $mpesa,
        private readonly MpesaPaymentRecorder $recorder,
    ) {}

    /** Whether guests can send M-Pesa prompts (configured on the server and switched on in Settings). */
    public static function isEnabled(MpesaService $mpesa): bool
    {
        return $mpesa->isConfigured()
            && ! in_array(strtolower(trim((string) Setting::getValue('mpesa_enabled', 'true'))), ['false', '0', 'off', 'no'], true);
    }

    public function initiate(Request $request): JsonResponse
    {
        $min = (int) config('mpesa.min_amount', 10);
        $max = (int) config('mpesa.max_amount', 250000);

        $data = $request->validate([
            'amount' => "required|integer|min:$min|max:$max",
            'phone' => 'required|string|max:20',
            'giver_name' => 'required|string|max:255',
            'on_behalf' => 'sometimes|boolean',
            'guest_code' => 'nullable|string|max:64',
            'gift_id' => 'nullable|integer',
            'message' => 'nullable|string|max:500',
            'idempotency_key' => 'required|string|max:64',
        ], [
            'amount.min' => "The smallest gift by M-Pesa is KES $min.",
            'amount.max' => 'That amount is above the M-Pesa limit for a single payment.',
            'giver_name.required' => 'Please tell us who the gift is from.',
        ]);

        if (! self::isEnabled($this->mpesa)) {
            return $this->errorResponse('M-Pesa gifts are not available right now.', 503);
        }

        $phone = MpesaService::normalizePhone($data['phone']);
        if (! $phone) {
            return $this->errorResponse(
                'Please enter a Safaricom number like 0712 345 678.',
                422,
                ['phone' => ['Please enter a Safaricom number like 0712 345 678.']]
            );
        }

        // A double-tapped button or a retried request returns the same payment.
        if ($existing = MpesaPayment::where('idempotency_key', $data['idempotency_key'])->first()) {
            return $this->successResponse($existing->toPublicArray());
        }

        // Safaricom cannot show two prompts on one phone at once; if one is
        // already waiting, point the guest back to it instead.
        $inFlight = MpesaPayment::where('phone', $phone)
            ->where('status', MpesaPayment::STATUS_PENDING)
            ->where('created_at', '>=', now()->subSeconds(self::IN_FLIGHT_SECONDS))
            ->latest('id')
            ->first();
        if ($inFlight) {
            return $this->errorResponse(
                'A payment request was just sent to this phone. Please complete it on the phone, or wait a minute and try again.',
                409,
                ['payment' => $inFlight->toPublicArray()]
            );
        }

        $guest = ! empty($data['guest_code'])
            ? Guest::where('unique_code', strtoupper($data['guest_code']))->first()
            : null;
        $gift = ! empty($data['gift_id'])
            ? Gift::where('id', $data['gift_id'])->where('is_cash_fund', true)->first()
            : null;

        try {
            $payment = MpesaPayment::create([
                'idempotency_key' => $data['idempotency_key'],
                'guest_id' => $guest?->id,
                'gift_id' => $gift?->id,
                'giver_name' => trim($data['giver_name']),
                'on_behalf' => (bool) ($data['on_behalf'] ?? false),
                'message' => $data['message'] ?? null,
                'phone' => $phone,
                'amount' => (int) $data['amount'],
                'account_reference' => MpesaService::accountReference($guest?->unique_code),
            ]);
        } catch (UniqueConstraintViolationException) {
            // The same request arrived twice at the same moment.
            return $this->successResponse(
                MpesaPayment::where('idempotency_key', $data['idempotency_key'])->firstOrFail()->toPublicArray()
            );
        }

        try {
            $response = $this->mpesa->stkPush(
                $phone,
                $payment->amount,
                $payment->account_reference,
                $payment->on_behalf ? 'Gift on behalf' : null,
            );
        } catch (\RuntimeException $e) {
            $payment->update(['status' => MpesaPayment::STATUS_FAILED, 'result_desc' => substr($e->getMessage(), 0, 255)]);

            return $this->errorResponse($e->getMessage(), 502, ['payment' => $payment->toPublicArray()]);
        }

        $payment->update([
            'merchant_request_id' => $response['MerchantRequestID'] ?? null,
            'checkout_request_id' => $response['CheckoutRequestID'],
        ]);

        return $this->createdResponse($payment->toPublicArray(), MpesaPayment::guestMessage(MpesaPayment::STATUS_PENDING, null));
    }

    /** Polled by the guest's browser while they enter their PIN. */
    public function status(string $publicId): JsonResponse
    {
        $payment = MpesaPayment::where('public_id', $publicId)->first();
        if (! $payment) {
            return $this->notFoundResponse('Payment not found');
        }

        if ($payment->isPending() && $payment->checkout_request_id) {
            $age = $payment->created_at->diffInSeconds(now());

            if ($age >= (int) config('mpesa.pending_timeout_seconds', 300)) {
                $payment = $this->recorder->expire($payment);
            } elseif ($age >= self::QUERY_AFTER_SECONDS && Cache::add("mpesa:query:{$payment->id}", 1, 10)) {
                // No callback yet: ask Safaricom (at most every 10 seconds per payment).
                $payment = $this->queryAndRecord($payment);
            }
        }

        return $this->successResponse($payment->toPublicArray());
    }

    /**
     * Safaricom's confirmation. The URL carries a secret token, the payment
     * must be one we created, and the amount must match. Always answers
     * "accepted" so Safaricom does not keep retrying.
     */
    public function callback(Request $request, string $token): JsonResponse
    {
        $expected = (string) config('mpesa.callback_token');
        if ($expected === '' || ! hash_equals($expected, $token)) {
            abort(404);
        }

        $callback = $request->input('Body.stkCallback');
        $checkoutId = is_array($callback) ? ($callback['CheckoutRequestID'] ?? null) : null;

        $payment = $checkoutId ? MpesaPayment::where('checkout_request_id', $checkoutId)->first() : null;
        if (! $payment) {
            Log::warning('M-Pesa callback for unknown payment', ['body' => $request->all()]);

            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
        }

        $metadata = [];
        foreach ($callback['CallbackMetadata']['Item'] ?? [] as $item) {
            if (isset($item['Name']) && array_key_exists('Value', $item)) {
                $metadata[$item['Name']] = $item['Value'];
            }
        }

        $this->recorder->record(
            $payment,
            (string) ($callback['ResultCode'] ?? '1'),
            $callback['ResultDesc'] ?? null,
            $metadata,
            $request->all(),
        );

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }

    /** Admin: every M-Pesa gift attempt with its outcome, newest first. */
    public function adminIndex(): JsonResponse
    {
        $payments = MpesaPayment::with('guest:id,name,unique_code')
            ->latest('id')
            ->limit(500)
            ->get()
            ->map(fn (MpesaPayment $p) => [
                'id' => $p->id,
                'giver_name' => $p->giver_name,
                'on_behalf' => $p->on_behalf,
                'invite' => $p->guest ? ['name' => $p->guest->name, 'code' => $p->guest->unique_code] : null,
                'phone' => $p->phone,
                'amount' => $p->amount,
                'status' => $p->status,
                'receipt' => $p->mpesa_receipt,
                'result_desc' => $p->result_desc,
                'message' => $p->message,
                'created_at' => $p->created_at,
                'paid_at' => $p->paid_at,
            ]);

        return $this->successResponse([
            'payments' => $payments,
            'summary' => [
                'received_total' => (int) MpesaPayment::where('status', MpesaPayment::STATUS_SUCCESS)->sum('amount'),
                'received_count' => MpesaPayment::where('status', MpesaPayment::STATUS_SUCCESS)->count(),
                'pending_count' => MpesaPayment::where('status', MpesaPayment::STATUS_PENDING)->count(),
            ],
            'enabled' => self::isEnabled($this->mpesa),
            'configured' => $this->mpesa->isConfigured(),
            'environment' => config('mpesa.env'),
        ]);
    }

    private function queryAndRecord(MpesaPayment $payment): MpesaPayment
    {
        $payment->update(['last_queried_at' => now()]);

        try {
            $result = $this->mpesa->stkQuery($payment->checkout_request_id);
        } catch (\Throwable $e) {
            Log::warning('M-Pesa status query failed', ['payment' => $payment->id, 'error' => $e->getMessage()]);

            return $payment;
        }

        if ($result && ! $result['pending'] && $result['result_code'] !== null) {
            return $this->recorder->record($payment, $result['result_code'], $result['result_desc']);
        }

        return $payment;
    }
}
