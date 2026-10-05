<?php

/**
 * Notify the admin about a new RSVP
 */

namespace App\Mail;

use App\Models\Guest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminRSVPNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $guest;

    public $attending;

    public $plusOnes;

    public $guestMessage;

    public $songRequest;

    /**
     * Create a new message instance.
     */
    public function __construct(Guest $guest, bool $attending, int $plusOnes = 0, ?string $guestMessage = null, ?string $songRequest = null)
    {
        $this->guest = $guest;
        $this->attending = $attending;
        $this->plusOnes = $plusOnes;
        $this->guestMessage = $guestMessage;
        $this->songRequest = $songRequest;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $status = $this->attending ? 'Confirmed ✅' : 'Declined ❌';

        return new Envelope(
            subject: "New RSVP Notification: {$this->guest->name} ($status)",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.admin-rsvp-notification',
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
