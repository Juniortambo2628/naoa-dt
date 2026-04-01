<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ScheduleChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $changeType;
    protected $eventName;
    protected $details;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $changeType, string $eventName, array $details = [])
    {
        $this->changeType = $changeType; // 'added', 'updated', 'cancelled'
        $this->eventName = $eventName;
        $this->details = $details;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $subject = match($this->changeType) {
            'added' => "New Event Added - {$this->eventName}",
            'updated' => "Schedule Update - {$this->eventName}",
            'cancelled' => "Event Cancelled - {$this->eventName}",
            default => "Wedding Schedule Update",
        };

        $message = (new MailMessage)
            ->subject($subject)
            ->greeting("Dear {$notifiable->name},")
            ->line($this->getMessageLine());

        if (!empty($this->details['time'])) {
            $message->line("**Time:** {$this->details['time']}");
        }
        if (!empty($this->details['location'])) {
            $message->line("**Location:** {$this->details['location']}");
        }
        if (!empty($this->details['description'])) {
            $message->line($this->details['description']);
        }

        return $message
            ->action('View Full Schedule', url('/programme'))
            ->line('Thank you for being part of our special day!')
            ->salutation('With love, Dinah & Tze Ren');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->changeType,
            'event_name' => $this->eventName,
            'details' => $this->details,
            'message' => $this->getMessageLine(),
        ];
    }

    protected function getMessageLine(): string
    {
        return match($this->changeType) {
            'added' => "A new event has been added to our wedding schedule: **{$this->eventName}**",
            'updated' => "There has been a change to **{$this->eventName}**. Please review the updated details below:",
            'cancelled' => "Unfortunately, **{$this->eventName}** has been cancelled. We apologize for any inconvenience.",
            default => "There's an update regarding our wedding schedule.",
        };
    }
}
