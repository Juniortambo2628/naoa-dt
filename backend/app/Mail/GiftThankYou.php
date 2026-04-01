<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class GiftThankYou extends Mailable
{
    use Queueable, SerializesModels;

    public $claim;
    public $subjectText;
    public $messageText;

    /**
     * Create a new message instance.
     */
    public function __construct($claim)
    {
        $this->claim = $claim;
        $this->subjectText = \App\Models\Setting::getValue('email_gift_subject', 'Thank you for your gift! - Dinah & Tze Ren');
        $this->messageText = \App\Models\Setting::getValue('email_gift_message', 'Thank you so much for your thoughtful gift.');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectText,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.gift-thank-you',
            with: [
                'name' => $this->claim->claimer_name,
                'giftName' => $this->claim->gift->name,
                'amount' => $this->claim->amount,
                'subject' => $this->subjectText,
                'messageText' => $this->messageText,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
