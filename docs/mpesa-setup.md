# M-Pesa cash gifts — setup

Guests tap **Send a gift with M-Pesa** on their invitation, pick an amount and
get the M-Pesa PIN prompt on their phone (STK Push). The gift is recorded
against their invite automatically, and appears in **Admin → Gifts → M-Pesa gifts**.

## What you need from Safaricom

1. **Pay Bill number** (business short code) and the registered business name.
2. A **Daraja account** (developer.safaricom.co.ke) with an app that has
   *Lipa Na M-Pesa Online* (M-Pesa Express). Its **Consumer Key** and
   **Consumer Secret**.
3. **Go Live** for that app on the Daraja portal. This needs the M-Pesa
   organisation portal login of the Pay Bill's **Business Administrator**
   (or Business Manager) to receive the OTP. After Go Live, Safaricom emails
   the **Lipa Na M-Pesa Online Passkey** and production keys.
4. A public **https** address for this API (Safaricom calls it back).

Go Live can take from hours to several days. Until then, fill in the Pay Bill
number in Admin and guests can pay from their M-Pesa menu; the prompt switches
on by itself once the keys are on the server.

## Server configuration (`backend/.env`)

```
MPESA_ENV=production            # or sandbox for testing
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=123456          # the Pay Bill number
MPESA_PASSKEY=...
MPESA_TRANSACTION_TYPE=CustomerPayBillOnline   # CustomerBuyGoodsOnline for a Till
MPESA_CALLBACK_TOKEN=<long random string, e.g. `openssl rand -hex 24`>
MPESA_CALLBACK_BASE_URL=https://api.example.com
```

Then `php artisan config:clear` (or `config:cache`) and `php artisan migrate`.

Keep these values in the server's `.env` only — never in Admin settings, the
repository or chat.

The scheduler must run every minute (`* * * * * php artisan schedule:run`):
it runs `mpesa:reconcile`, which asks Safaricom about any prompt whose callback
did not arrive.

## Testing with the sandbox

Use `MPESA_ENV=sandbox`, short code `174379` and the sandbox passkey from the
Daraja "M-Pesa Express Simulate" page, with your sandbox app's keys. Admin shows
"Test mode" while in the sandbox.

## How busy moments are handled

- A double-tapped Send makes one prompt (idempotency key per send).
- One waiting prompt per phone at a time; the guest is told to check their phone.
- Each Safaricom receipt is recorded once, even if the callback repeats.
- The access token is shared between requests, so many guests at once do not
  hit Safaricom's token limit.
- Rate limits are per phone number (guests at the venue share one Wi‑Fi IP).
- Missing callbacks are recovered by status checks and the reconcile command;
  a late success after a "no response" is still recorded.
