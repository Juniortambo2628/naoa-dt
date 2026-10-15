<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CollaboratorInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $invitee,
        public User $inviter,
        public string $link,
        public ?string $personalMessage = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->inviter->name.' invited you to help plan the wedding',
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.collaborator-invitation');
    }
}
