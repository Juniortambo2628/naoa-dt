<?php

/*
|--------------------------------------------------------------------------
| M-Pesa (Safaricom Daraja) — Lipa Na M-Pesa Online / STK Push
|--------------------------------------------------------------------------
|
| Credentials live ONLY in the server's .env file. They are never stored in
| the settings table and never returned by any API: admins toggle the feature
| and the paybill shown to guests in Settings, but the keys stay here.
|
| Getting the values (see docs/mpesa-setup.md):
| - MPESA_ENV: "sandbox" while testing, "production" after Daraja "Go Live".
| - MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET: from the app on
|   developer.safaricom.co.ke (the production app after Go Live).
| - MPESA_SHORTCODE: the paybill number.
| - MPESA_PASSKEY: the Lipa Na M-Pesa Online passkey Safaricom emails after
|   Go Live (the sandbox passkey is on the Daraja test credentials page).
| - MPESA_CALLBACK_TOKEN: any long random string; it is part of the callback
|   URL so only Safaricom (who is given the URL) can confirm payments.
|
*/

return [
    'env' => env('MPESA_ENV', 'sandbox'),

    'base_url' => env('MPESA_ENV', 'sandbox') === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke',

    'consumer_key' => env('MPESA_CONSUMER_KEY'),
    'consumer_secret' => env('MPESA_CONSUMER_SECRET'),
    'shortcode' => env('MPESA_SHORTCODE'),
    'passkey' => env('MPESA_PASSKEY'),

    // Paybill: CustomerPayBillOnline. A Till (Buy Goods) uses
    // CustomerBuyGoodsOnline with MPESA_TILL_NUMBER as the receiving party.
    'transaction_type' => env('MPESA_TRANSACTION_TYPE', 'CustomerPayBillOnline'),
    'till_number' => env('MPESA_TILL_NUMBER'),

    // Public HTTPS base of this API (no trailing slash), e.g.
    // https://api.dntwed.okjtech.co.ke — the callback is built from it.
    'callback_base_url' => env('MPESA_CALLBACK_BASE_URL', env('APP_URL')),
    'callback_token' => env('MPESA_CALLBACK_TOKEN'),

    // Shown on the guest's prompt / statement when the invite has no code.
    'default_account_reference' => env('MPESA_ACCOUNT_REFERENCE', 'WEDDING'),
    'transaction_desc' => env('MPESA_TRANSACTION_DESC', 'Wedding gift'),

    'min_amount' => (int) env('MPESA_MIN_AMOUNT', 10),
    'max_amount' => (int) env('MPESA_MAX_AMOUNT', 250000),

    // How long a prompt may stay unanswered before it is marked timed out.
    'pending_timeout_seconds' => (int) env('MPESA_PENDING_TIMEOUT', 300),

    // HTTP timeout for calls to Safaricom, kept short so a slow Daraja can
    // never tie up the server's PHP workers during a rush.
    'http_timeout' => (int) env('MPESA_HTTP_TIMEOUT', 20),
];
