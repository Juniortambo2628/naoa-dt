<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use PragmaRX\Google2FALaravel\Facade as Google2FA;

class TwoFactorController extends Controller
{
    /**
     * Generate 2FA setup data (secret and QR code)
     */
    public function setup(Request $request)
    {
        $user = $request->user();
        
        // Generate a new secret
        $secret = Google2FA::generateSecretKey();
        
        // Temporarily store the secret in the session or user model (not confirmed yet)
        $user->update(['two_factor_secret' => $secret]);

        $qrCodeUrl = Google2FA::getQRCodeUrl(
            config('app.name', 'Wedding Dashboard'),
            $user->email,
            $secret
        );

        return response()->json([
            'secret' => $secret,
            'qr_code_svg' => (string) QrCode::size(200)->generate($qrCodeUrl),
        ]);
    }

    /**
     * Confirm 2FA setup
     */
    public function confirm(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $user = $request->user();
        $secret = $user->two_factor_secret;

        if (!$secret) {
            return response()->json(['message' => '2FA setup not initiated'], 422);
        }

        $valid = Google2FA::verifyKey($secret, $request->code, 1); // 1 = ±30 seconds window

        if ($valid) {
            $user->update([
                'two_factor_confirmed_at' => now(),
            ]);

            return response()->json([
                'message' => 'Two-factor authentication enabled successfully',
                'user' => $user->fresh()
            ]);
        }

        return response()->json(['message' => 'Invalid verification code'], 422);
    }

    /**
     * Disable 2FA
     */
    public function disable(Request $request)
    {
        $user = $request->user();
        
        $user->update([
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_recovery_codes' => null,
        ]);

        return response()->json(['message' => 'Two-factor authentication disabled successfully']);
    }
}
