<?php

namespace App\Support;

use App\Models\Guest;
use App\Models\Setting;

/**
 * Builds a guest's personalised invitation link and WhatsApp message from the
 * `whatsapp_message_template` setting (Admin → Settings), rendered the same way
 * as renderWhatsAppMessage() in frontend/src/utils/whatsappMessage.js so
 * exported messages match the ones sent from the dashboard.
 */
class InviteMessage
{
    /** Mirrors DEFAULT_WHATSAPP_TEMPLATE in frontend/src/utils/whatsappMessage.js. */
    public const DEFAULT_TEMPLATE = <<<'TPL'
Hi *{name}*! 💌

We are so excited to invite you to our wedding!

Your invitation card (PDF): {pdf_link}

You can view your personalized digital invitation and RSVP here:
{invite_link}

We can't wait to celebrate with you!
— {couple}
TPL;

    protected string $baseUrl;

    protected string $template;

    protected string $couple;

    /** $baseUrl is the public site origin; defaults to config('app.frontend_url'). */
    public function __construct(?string $baseUrl = null)
    {
        $this->baseUrl = rtrim($baseUrl ?: config('app.frontend_url'), '/');
        // Resolved once: settings are read from the database on every call.
        $template = (string) Setting::getValue('whatsapp_message_template', '');
        $this->template = trim($template) !== '' ? $template : self::DEFAULT_TEMPLATE;
        $this->couple = WeddingInfo::coupleNames();
    }

    public function invitationUrl(Guest $guest): string
    {
        return $this->baseUrl.'/invitation/'.$guest->unique_code;
    }

    /** Exports carry no PDF link, so {pdf_link} lines are dropped as on the dashboard. */
    public function whatsappText(Guest $guest, ?string $pdfLink = null): string
    {
        $lines = explode("\n", str_replace("\r\n", "\n", $this->template));
        if (! $pdfLink) {
            $lines = array_filter($lines, fn ($line) => ! str_contains($line, '{pdf_link}'));
        }

        $values = [
            'name' => $guest->name,
            'invite_link' => $this->invitationUrl($guest),
            'pdf_link' => $pdfLink ?? '',
            'code' => $guest->unique_code,
            'couple' => $this->couple,
        ];

        $text = preg_replace_callback(
            '/\{(name|invite_link|pdf_link|code|couple)\}/',
            fn ($m) => (string) $values[$m[1]],
            implode("\n", $lines)
        );

        return trim(preg_replace('/\n{3,}/', "\n\n", $text));
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
