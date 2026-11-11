/**
 * Helpers for M-Pesa cash gifts. Mirrors the server's rules
 * (App\Services\MpesaService::normalizePhone) so mistakes are caught before
 * anything is sent.
 */

/** Gift amounts offered as one-tap choices, in KES. */
export const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

/**
 * Normalise a Kenyan mobile number to 2547XXXXXXXX / 2541XXXXXXXX.
 * Accepts "0712 345 678", "+254712345678", "712345678", "254712345678".
 * Returns null when it is not a Kenyan mobile number.
 */
export function normalizeKenyanPhone(value) {
  let digits = String(value ?? '').replace(/\D+/g, '');
  if (/^0[71]\d{8}$/.test(digits)) digits = `254${digits.slice(1)}`;
  else if (/^[71]\d{8}$/.test(digits)) digits = `254${digits}`;
  return /^254[71]\d{8}$/.test(digits) ? digits : null;
}

/** Show a number the way people read it: "0712 345 678". */
export function formatKenyanPhone(value) {
  const normalized = normalizeKenyanPhone(value);
  if (!normalized) return String(value ?? '');
  const local = `0${normalized.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

/** "KES 1,000" */
export function formatKes(amount) {
  const n = Number(amount) || 0;
  return `KES ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

/** A fresh key per send, so a double tap or a retried request makes one prompt. */
export function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
