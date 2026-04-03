<?php

namespace App\Mail;

use App\Models\Guest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvitationEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $guest;
    public $rsvpUrl;
    public $subjectText;
    public $messageText;
    public $attachmentPath;

    /**
     * Create a new message instance.
     */
    public function __construct(Guest $guest, $attachmentPath = null)
    {
        $this->guest = $guest;
        $this->attachmentPath = $attachmentPath;
        
        // Point to the formal invitation landing page
        $this->rsvpUrl = config('app.frontend_url', 'http://localhost:5173') . '/invitation/' . $guest->unique_code;
        
        $this->subjectText = \App\Models\Setting::getValue('email_invitation_subject', 'You are invited! Dinah & Tze Ren\'s Wedding');
        $this->messageText = \App\Models\Setting::getValue('email_invitation_message', 'We are delighted to invite you to celebrate our wedding day.');
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
            view: 'emails.invitation',
            with: [
                'subject' => $this->subjectText,
                'messageText' => $this->messageText,
                'rsvpCode' => $this->guest->unique_code,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        if ($this->attachmentPath && file_exists($this->attachmentPath)) {
            return [
                \Illuminate\Mail\Mailables\Attachment::fromPath($this->attachmentPath)
                    ->as('Wedding_Invitation.png')
                    ->withMime('image/png'),
            ];
        }
        return [];
    }
}
