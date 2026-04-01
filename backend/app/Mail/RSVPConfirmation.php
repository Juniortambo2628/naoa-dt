<?php

namespace App\Mail;

use App\Models\Guest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RSVPConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public $guest;
    public $attending;
    public $subjectText;
    public $messageText;

    /**
     * Create a new message instance.
     */
    public function __construct(Guest $guest, bool $attending)
    {
        $this->guest = $guest;
        $this->attending = $attending;
        
        $this->subjectText = \App\Models\Setting::getValue('email_rsvp_subject', 'RSVP Confirmation - Dinah & Tze Ren\'s Wedding');
        
        if ($attending) {
            $this->messageText = \App\Models\Setting::getValue('email_rsvp_attending_message', 'We\'re so excited you can make it!');
        } else {
            $this->messageText = \App\Models\Setting::getValue('email_rsvp_declined_message', 'We\'ll miss you!');
        }
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
            view: 'emails.rsvp-confirmation',
            with: [
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
