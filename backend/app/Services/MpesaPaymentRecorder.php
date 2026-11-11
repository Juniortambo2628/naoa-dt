<?php

namespace App\Services;

use App\Models\Gift;
use App\Models\GiftClaim;
use App\Models\MpesaPayment;
use App\Traits\AdminNotifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * The single place a payment's outcome is recorded.
 *
 * The result can reach us three ways — Safaricom's callback, the guest's
 * status check and the mpesa:reconcile command — sometimes at the same
 * moment. Every path goes through record(), which locks the payment row and
 * only acts while it is still pending, so a gift is recorded exactly once
 * however many times or ways the result arrives.
 */
class MpesaPaymentRecorder
{
    use AdminNotifiable;

    /**
     * @param  array  $metadata  CallbackMetadata items as name => value
     *                           (Amount, MpesaReceiptNumber, TransactionDate, PhoneNumber).
     * @return MpesaPayment the payment as it stands after recording
     */
    public function record(MpesaPayment $payment, string $resultCode, ?string $resultDesc = null, array $metadata = [], ?array $raw = null): MpesaPayment
    {
        $newlyPaid = false;

        $payment = DB::transaction(function () use ($payment, $resultCode, $resultDesc, $metadata, $raw, &$newlyPaid) {
            /** @var MpesaPayment $locked */
            $locked = MpesaPayment::whereKey($payment->getKey())->lockForUpdate()->firstOrFail();
            $receipt = isset($metadata['MpesaReceiptNumber']) ? (string) $metadata['MpesaReceiptNumber'] : null;

            // A timeout we inferred ourselves (no result_code from Safaricom)
            // is overturned by a genuine success arriving later: the money
            // moved, so the gift must be recorded.
            $inferredTimeout = $locked->status === MpesaPayment::STATUS_TIMEOUT && $locked->result_code === null;
            $lateSuccess = $inferredTimeout && MpesaPayment::statusForResultCode($resultCode) === MpesaPayment::STATUS_SUCCESS;

            if (! $locked->isPending() && ! $lateSuccess) {
                // Already recorded. A late callback can still add the receipt
                // number to a payment the reconciler confirmed without one.
                if ($locked->status === MpesaPayment::STATUS_SUCCESS && ! $locked->mpesa_receipt && $receipt) {
                    $locked->update(['mpesa_receipt' => $receipt, 'raw_callback' => $raw ?? $locked->raw_callback]);
                    $locked->giftClaim?->update(['payment_reference' => $receipt]);
                }

                return $locked;
            }

            $status = MpesaPayment::statusForResultCode($resultCode);

            // The amount on a prompt cannot be changed by the customer, so a
            // mismatch means the callback is not genuine: do not record a gift.
            if ($status === MpesaPayment::STATUS_SUCCESS && isset($metadata['Amount'])
                && (int) round((float) $metadata['Amount']) !== (int) $locked->amount) {
                Log::warning('M-Pesa callback amount mismatch', ['payment' => $locked->id, 'metadata' => $metadata]);
                $status = MpesaPayment::STATUS_FAILED;
                $resultDesc = 'Amount mismatch';
            }

            $updates = [
                'status' => $status,
                'result_code' => $resultCode,
                'result_desc' => $resultDesc ? substr($resultDesc, 0, 255) : null,
                'raw_callback' => $raw ?? $locked->raw_callback,
            ];

            if ($status === MpesaPayment::STATUS_SUCCESS) {
                $updates['mpesa_receipt'] = $receipt;
                $updates['paid_phone'] = isset($metadata['PhoneNumber']) ? (string) $metadata['PhoneNumber'] : $locked->phone;
                $updates['paid_at'] = self::parseTransactionDate($metadata['TransactionDate'] ?? null) ?? now();

                $claim = GiftClaim::create([
                    'gift_id' => ($locked->gift_id ?: $this->cashGiftFund()->id),
                    'guest_id' => $locked->guest_id,
                    'claimer_name' => $locked->giver_name,
                    'amount' => $locked->amount,
                    'message' => $locked->message,
                    'payment_method' => 'mpesa',
                    'payment_reference' => $receipt,
                ]);
                $updates['gift_claim_id'] = $claim->id;
                $newlyPaid = true;
            }

            $locked->update($updates);

            return $locked;
        });

        if ($newlyPaid) {
            $this->notifyAdmin(
                'GiftClaimed',
                'M-Pesa gift received',
                sprintf('%s sent KES %s via M-Pesa', $payment->giver_name, number_format($payment->amount)),
                'gift'
            );
        }

        return $payment;
    }

    /** Mark a prompt that never got an answer as timed out (no money moved). */
    public function expire(MpesaPayment $payment, string $reason = 'No response from the phone'): MpesaPayment
    {
        return DB::transaction(function () use ($payment, $reason) {
            $locked = MpesaPayment::whereKey($payment->getKey())->lockForUpdate()->firstOrFail();
            if ($locked->isPending()) {
                $locked->update(['status' => MpesaPayment::STATUS_TIMEOUT, 'result_desc' => $reason]);
            }

            return $locked;
        });
    }

    /**
     * Gifts sent from the invitation go to the first cash fund in the gift
     * registry; one called "Cash Gifts" is created if there is none yet.
     */
    private function cashGiftFund(): Gift
    {
        return Gift::where('is_cash_fund', true)->orderBy('id')->first()
            ?? Gift::create([
                'name' => 'Cash Gifts',
                'description' => 'Cash gifts sent with M-Pesa from the invitation.',
                'category' => 'experience',
                'is_cash_fund' => true,
                'is_available' => true,
            ]);
    }

    /** Daraja sends TransactionDate as 20261114153045 (Nairobi time). */
    private static function parseTransactionDate(mixed $value): ?Carbon
    {
        if (! $value || ! preg_match('/^\d{14}$/', (string) $value)) {
            return null;
        }

        try {
            return Carbon::createFromFormat('YmdHis', (string) $value, 'Africa/Nairobi');
        } catch (\Throwable) {
            return null;
        }
    }
}
