<?php

namespace App\Support;

use App\Models\Guest;

/**
 * Builds a guest's personalised invitation link and WhatsApp message.
 * The message text mirrors handleWhatsAppInvite() in
 * frontend/src/pages/admin/AdminGuests.jsx so exported messages match the
 * ones sent from the dashboard.
 */
class InviteMessage
{
    protected string $baseUrl;

    protected string $signature;

    /** $baseUrl is the public site origin; defaults to config('app.frontend_url'). */
    public function __construct(?string $baseUrl = null)
    {
        $this->baseUrl = rtrim($baseUrl ?: config('app.frontend_url'), '/');
        // Resolved once: WeddingInfo reads settings from the database on every call.
        $this->signature = WeddingInfo::coupleNames();
    }

    public function invitationUrl(Guest $guest): string
    {
        return $this->baseUrl.'/invitation/'.$guest->unique_code;
    }

    public function whatsappText(Guest $guest): string
    {
        return "Hi *{$guest->name}*! 💌\n\n"
            ."We are so excited to invite you to our wedding!\n\n"
            ."You can view your personalized digital invitation and RSVP here:\n"
            .$this->invitationUrl($guest)."\n\n"
            ."We can't wait to celebrate with you!\n"
            .'— '.$this->signature;
    }

    /** Click-to-chat link that opens WhatsApp with the message pre-filled, or null without a phone. */
    public function whatsappLink(Guest $guest): ?string
    {
        $digits = preg_replace('/\D/', '', (string) $guest->phone);

        if ($digits === '') {
            return null;
        }

        return 'https://wa.me/'.$digits.'?text='.rawurlencode($this->whatsappText($guest));
    }
}
