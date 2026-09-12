<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuestTravelDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'guest_id',
        'hotel_name',
        'hotel_address',
        'hotel_check_in',
        'hotel_check_out',
        'hotel_confirmation',
        'hotel_notes',
        'airline',
        'flight_number',
        'flight_departure',
        'flight_arrival',
        'flight_departure_airport',
        'flight_arrival_airport',
        'flight_confirmation',
        'flight_notes',
        'ticket_file_path',
        'ticket_file_name',
        'ticket_file_type',
        'transport_method',
        'transport_notes',
    ];

    protected $casts = [
        'hotel_check_in' => 'date',
        'hotel_check_out' => 'date',
        'flight_departure' => 'datetime',
        'flight_arrival' => 'datetime',
    ];

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class);
    }
}
