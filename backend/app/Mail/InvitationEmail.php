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
    public $weddingDateFormatted;
    public $rsvpDeadline;

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
        
        $countdown = \App\Models\PageContent::where('section_key', 'countdown')->first();
        $weddingDateRaw = $countdown->content['wedding_date'] ?? '2026-11-14';
        try {
            $date = \Carbon\Carbon::parse($weddingDateRaw);
            $this->weddingDateFormatted = $date->format('F jS, Y');
            // Suggest an RSVP deadline of 1 month prior
            // Since `subMonth` modifies the instance, we create a copy
            $this->rsvpDeadline = \Carbon\Carbon::parse($weddingDateRaw)->subMonth()->format('F jS, Y');
        } catch (\Exception $e) {
            $this->weddingDateFormatted = 'your upcoming wedding date';
            $this->rsvpDeadline = 'one month before the event';
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
            view: 'emails.invitation',
            with: [
                'subject' => $this->subjectText,
                'messageText' => $this->messageText,
                'rsvpCode' => $this->guest->unique_code,
                'weddingDate' => $this->weddingDateFormatted,
                'rsvpDeadline' => $this->rsvpDeadline,
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
