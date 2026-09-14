<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FlightStatusNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $guestName,
        public string $flightNumber,
        public string $status,
        public array $flightData,
        public ?array $previousStatus,
        public ?string $changeType,
    ) {}

    public function envelope(): Envelope
    {
        $subject = match($this->changeType) {
            'cancelled' => "Flight {$this->flightNumber} Cancelled - {$this->guestName}",
            'delayed' => "Flight {$this->flightNumber} Delayed - {$this->guestName}",
            'gate_change' => "Flight {$this->flightNumber} Gate Change - {$this->guestName}",
            'diverted' => "Flight {$this->flightNumber} Diverted - {$this->guestName}",
            'status_change' => "Flight {$this->flightNumber} Status Update - {$this->guestName}",
            default => "Flight Status Update - {$this->guestName}",
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(htmlString: $this->buildHtml());
    }

    private function buildHtml(): string
    {
        $statusColor = match($this->changeType) {
            'cancelled' => '#DC2626',
            'delayed' => '#D97706',
            'gate_change' => '#2563EB',
            'diverted' => '#7C3AED',
            default => '#059669',
        };

        $statusIcon = match($this->changeType) {
            'cancelled' => '❌',
            'delayed' => '⏰',
            'gate_change' => '🚪',
            'diverted' => '🔄',
            default => '✈️',
        };

        $departure = $this->flightData['departure_scheduled'] ?? 'N/A';
        $arrival = $this->flightData['arrival_estimated'] ?? $this->flightData['arrival_scheduled'] ?? 'N/A';
        $delay = $this->flightData['delay_arrival'] ?? 0;
        $gate = $this->flightData['arrival_gate'] ?? 'TBA';
        $terminal = $this->flightData['arrival_terminal'] ?? 'TBA';
        $depIata = $this->flightData['departure_iata'] ?? 'N/A';
        $arrIata = $this->flightData['arrival_iata'] ?? 'N/A';
        $depAirport = $this->flightData['departure_airport'] ?? '';
        $arrAirport = $this->flightData['arrival_airport'] ?? '';

        $delayRow = '';
        if ($delay > 0) {
            $delayRow = "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 13px;'>Delay</td><td style='padding: 8px 0; color: #D97706; font-size: 14px; font-weight: 600; text-align: right;'>+{$delay} minutes</td></tr>";
        }

        $gateRow = '';
        if ($gate !== 'TBA') {
            $gateRow = "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 13px;'>Gate</td><td style='padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;'>{$gate}</td></tr>";
        }

        $terminalRow = '';
        if ($terminal !== 'TBA') {
            $terminalRow = "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 13px;'>Terminal</td><td style='padding: 8px 0; color: #111827; font-size: 14px; text-align: right;'>{$terminal}</td></tr>";
        }

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        </head>
        <body style='margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'>
            <div style='max-width: 500px; margin: 0 auto; padding: 20px;'>
                <div style='background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);'>
                    <div style='background: linear-gradient(135deg, #A67B5B 0%, #8C6A4D 100%); padding: 30px; text-align: center;'>
                        <div style='font-size: 40px; margin-bottom: 10px;'>{$statusIcon}</div>
                        <h1 style='color: white; margin: 0; font-size: 22px; font-weight: 600;'>Flight Status Update</h1>
                        <p style='color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;'>Dinah &amp; Tze Ren's Wedding</p>
                    </div>
                    <div style='background: {$statusColor}; padding: 16px; text-align: center;'>
                        <p style='color: white; margin: 0; font-size: 16px; font-weight: 600; text-transform: uppercase;'>Flight {$this->flightNumber} &mdash; {$this->status}</p>
                    </div>
                    <div style='padding: 30px;'>
                        <p style='color: #374151; margin: 0 0 20px; font-size: 15px;'>Hi {$this->guestName},</p>
                        <p style='color: #374151; margin: 0 0 20px; font-size: 15px;'>There's been a change to your flight <strong>{$this->flightNumber}</strong>.</p>
                        <div style='background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;'>
                            <table style='width: 100%; border-collapse: collapse;'>
                                <tr><td style='padding: 8px 0; color: #6b7280; font-size: 13px;'>Route</td><td style='padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;'>{$depIata} &rarr; {$arrIata}</td></tr>
                                <tr><td style='padding: 8px 0; color: #6b7280; font-size: 13px;'>Departure</td><td style='padding: 8px 0; color: #111827; font-size: 14px; text-align: right;'>{$departure}</td></tr>
                                <tr><td style='padding: 8px 0; color: #6b7280; font-size: 13px;'>Arrival</td><td style='padding: 8px 0; color: #111827; font-size: 14px; text-align: right;'>{$arrival}</td></tr>
                                {$delayRow}
                                {$gateRow}
                                {$terminalRow}
                            </table>
                        </div>
                        <p style='color: #6b7280; font-size: 13px; margin: 0; text-align: center;'>You can update your travel details anytime from your digital invitation.</p>
                    </div>
                    <div style='background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;'>
                        <p style='color: #9ca3af; margin: 0; font-size: 12px;'>Sent with love from Dinah &amp; Tze Ren's Wedding</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        HTML;
    }
}
