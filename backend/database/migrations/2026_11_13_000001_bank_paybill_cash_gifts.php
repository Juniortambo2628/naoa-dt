<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cash gifts by bank Pay Bill while the couple's own M-Pesa Pay Bill awaits
 * approval.
 *
 * - `mpesa_payments.method`: "stk" for a prompt sent to the guest's phone,
 *   "paybill" for a gift the guest sent from their M-Pesa menu and then
 *   reported on the invitation (amount + M-Pesa code). Reported gifts are only
 *   ever shown to the guest who reported them and to the couple.
 * - The Pay Bill guests see: Standard Chartered's business number with the
 *   bride's account, and the name the money goes to. The prompt is switched
 *   off: a bank's Pay Bill cannot send prompts on the couple's behalf.
 *   Everything stays editable in Admin › Gifts › M-Pesa gifts.
 */
return new class extends Migration
{
    private const PAYBILL = [
        'mpesa_paybill_number' => '329329',
        'mpesa_paybill_account' => '0100301493000',
        'mpesa_paybill_name' => 'Dinah Achieng Tambo',
        'mpesa_paybill_bank' => 'Standard Chartered',
        'mpesa_enabled' => 'false',
    ];

    public function up(): void
    {
        if (! Schema::hasColumn('mpesa_payments', 'method')) {
            Schema::table('mpesa_payments', function (Blueprint $table) {
                $table->string('method', 20)->default('stk')->after('status')->index();
            });
        }

        // Test databases start empty; the prompt tests expect the default (on).
        if (app()->environment('testing')) {
            return;
        }

        foreach (self::PAYBILL as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value, 'group' => 'gifts']);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('mpesa_payments', 'method')) {
            Schema::table('mpesa_payments', function (Blueprint $table) {
                $table->dropIndex(['method']);
                $table->dropColumn('method');
            });
        }

        Setting::whereIn('key', ['mpesa_paybill_name', 'mpesa_paybill_bank'])->delete();
    }
};
