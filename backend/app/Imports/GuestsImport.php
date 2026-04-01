<?php

namespace App\Imports;

use App\Models\Guest;
use App\Models\Invitation;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Str;

class GuestsImport implements ToModel, WithHeadingRow
{
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        // Skip empty rows
        if (empty($row['names']) && empty($row['name'])) {
            return null;
        }

        $name = trim($row['names'] ?? $row['name']);
        $email = !empty($row['email']) ? trim($row['email']) : null;
        $phone = !empty($row['telphone_number']) ? trim($row['telphone_number']) : null;
        $method = !empty($row['save_the_date_sent_via_whatsappemail']) ? trim($row['save_the_date_sent_via_whatsappemail']) : null;
        
        $totalInvites = 1;
        if (isset($row['number_of_invites'])) {
            $totalInvites = (int)$row['number_of_invites'];
        }
        $plusOnesAllowed = max(0, $totalInvites - 1);
        $group = !empty($row['group']) ? trim($row['group']) : 'Invited';

        // Check if guest exists by email or name
        $guest = null;
        if ($email) {
            $guest = Guest::where('email', $email)->first();
        }
        
        if (!$guest) {
            $guest = Guest::where('name', $name)->first();
        }

        if ($guest) {
            // User requested NOT to overwrite existing data in this phase, 
            // but for the basic import we will just skip it.
            // Conflict resolution will be handled by a separate flow.
            return null;
        }

        // Create new guest
        $guest = Guest::create([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'save_the_date_method' => $method,
            'group' => $group,
            'plus_ones_allowed' => 0, // We create dedicated records below if needed
            'rsvp_status' => 'pending',
        ]);

        // Create dedicated plus-one records if specified
        for ($i = 1; $i <= $plusOnesAllowed; $i++) {
            $po = Guest::create([
                'name' => $guest->name . " (Plus One " . $i . ")",
                'group' => $group,
                'parent_guest_id' => $guest->id,
                'plus_ones_allowed' => 0,
                'rsvp_status' => 'pending',
            ]);
            Invitation::create(['guest_id' => $po->id, 'status' => 'pending']);
        }

        // Create pending invitation for the new guest
        Invitation::create([
            'guest_id' => $guest->id,
            'status' => 'pending',
        ]);

        return $guest;
    }
}
