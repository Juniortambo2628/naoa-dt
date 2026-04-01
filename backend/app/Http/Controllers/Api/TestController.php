<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Models\Guest;
use App\Models\Invitation;

class TestController extends Controller
{
    /**
     * Send a test email to a specific address.
     */
    public function sendTestEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'type' => 'required|in:invitation,rsvp_confirmation',
        ]);

        $email = $request->email;
        $type = $request->type;

        try {
            // Mock data for test
            $mockGuest = new Guest([
                'name' => 'Test Guest',
                'email' => $email,
                'unique_code' => 'TEST-CODE-123',
                'group' => 'Family',
                'plus_ones_allowed' => 1
            ]);
            
            // Note: In a real app we would use Mailable classes.
            // For now, if no Mailables exist, we might raw mock it or use a simple view.
            
            Mail::send([], [], function ($message) use ($email, $type) {
                $message->to($email)
                        ->subject('Test Email: ' . ucfirst(str_replace('_', ' ', $type)))
                        ->html("<h1>This is a test email</h1><p>Type: $type</p><p>If you see this, email sending is configured correctly!</p>");
            });

            return response()->json(['message' => 'Test email sent successfully!']);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send email',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
