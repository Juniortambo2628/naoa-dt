<?php

namespace App\Console\Commands;

use App\Models\MpesaPayment;
use App\Services\MpesaPaymentRecorder;
use App\Services\MpesaService;
use Illuminate\Console\Command;

/**
 * Safety net for M-Pesa gifts whose confirmation callback never arrived
 * (Safaricom outage, our server briefly down, guest closed the page).
 *
 * Runs every minute from the scheduler: asks Safaricom for the outcome of
 * each prompt that is still pending after a minute, and marks prompts nobody
 * answered as timed out. Recording goes through MpesaPaymentRecorder, so a
 * payment confirmed here and by a late callback is still counted once.
 */
class ReconcileMpesaPayments extends Command
{
    protected $signature = 'mpesa:reconcile {--limit=50 : Most payments to check per run}';

    protected $description = 'Resolve M-Pesa gift prompts whose confirmation never arrived';

    public function handle(MpesaService $mpesa, MpesaPaymentRecorder $recorder): int
    {
        if (! $mpesa->isConfigured()) {
            return self::SUCCESS;
        }

        $timeout = (int) config('mpesa.pending_timeout_seconds', 300);
        $checked = 0;
        $resolved = 0;

        MpesaPayment::where('status', MpesaPayment::STATUS_PENDING)
            ->where('created_at', '<=', now()->subMinute())
            ->where(fn ($q) => $q->whereNull('last_queried_at')->orWhere('last_queried_at', '<=', now()->subSeconds(50)))
            ->orderBy('id')
            ->limit((int) $this->option('limit'))
            ->get()
            ->each(function (MpesaPayment $payment) use ($mpesa, $recorder, $timeout, &$checked, &$resolved) {
                $checked++;

                // A prompt that never reached Safaricom has nothing to query.
                if (! $payment->checkout_request_id) {
                    $recorder->expire($payment, 'Request was not sent');
                    $resolved++;

                    return;
                }

                $payment->update(['last_queried_at' => now()]);
                $result = $mpesa->stkQuery($payment->checkout_request_id);

                if ($result && ! $result['pending'] && $result['result_code'] !== null) {
                    $recorder->record($payment, $result['result_code'], $result['result_desc']);
                    $resolved++;
                } elseif ($payment->created_at->diffInSeconds(now()) >= $timeout) {
                    $recorder->expire($payment);
                    $resolved++;
                }
            });

        if ($checked > 0) {
            $this->info("Checked $checked pending M-Pesa payment(s); resolved $resolved.");
        }

        return self::SUCCESS;
    }
}
