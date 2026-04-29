<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guest;
use App\Models\RsvpResponse;
use App\Models\Invitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\GuestsImport;
use App\Services\GuestService;
use App\Http\Resources\GuestResource;

class GuestController extends Controller
{
    /**
     * Get all guests (admin only)
     */
    public function index(Request $request)
    {
        // Only show primary guests (not plus-ones) with their plus ones included
        /** @var \Illuminate\Database\Eloquent\Builder $query */
        $query = Guest::with(['rsvpResponse', 'invitation', 'parentGuest', 'plusOnes.invitation', 'plusOnes.rsvpResponse']);

        // Filter by group
        if ($request->has('group')) {
            $query->where('group', $request->group);
        }

        // Filter by RSVP status
        if ($request->has('status')) {
            if ($request->status === 'attending' || $request->status === 'confirmed') {
                $query->where('rsvp_status', 'confirmed');
            } elseif ($request->status === 'declined') {
                $query->where('rsvp_status', 'declined');
            } elseif ($request->status === 'pending') {
                $query->where('rsvp_status', 'pending');
            }
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function (\Illuminate\Database\Eloquent\Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return GuestResource::collection($query->paginate(20));
    }

    /**
     * Get guest by unique code (public)
     */
    public function getByCode(string $code)
    {
        $guest = Guest::with(['rsvpResponse', 'invitation'])
            ->where('unique_code', strtoupper($code))
            ->first();

        if (!$guest) {
            return response()->json(['message' => 'Guest not found'], 404);
        }

        // Update invitation opened status
        /** @var \App\Models\Invitation|null $invitation */
        $invitation = $guest->invitation;
        if ($invitation) {
            $invitation->update([
                'status' => 'opened',
                'opened_at' => now(),
            ]);
        }

        return response()->json($guest);
    }

    /**
     * Submit RSVP response (public)
     */
    public function submitRsvp(Request $request, string $code, GuestService $guestService)
    {
        $request->validate([
            'plus_ones_count' => 'integer|min:0',
            'message' => 'nullable|string|max:1000',
        ]);

        $guest = Guest::where('unique_code', strtoupper($code))->first();

        if (!$guest) {
            return response()->json(['message' => 'Guest not found'], 404);
        }

        $result = $guestService->submitRsvp($guest, $request->all());

        if (!$result['success']) {
            return response()->json(['message' => $result['message'], 'error' => $result['error']], 500);
        }

        return response()->json([
            'message' => $result['message'],
            'guest' => new GuestResource($guest->fresh(['rsvpResponse'])),
        ]);
    }

    /**
     * Mark an invitation as sent via WhatsApp
     */
    public function markWhatsappSent(Guest $guest)
    {
        $invitation = $guest->invitation()->updateOrCreate(
            ['guest_id' => $guest->id],
            [
                'status' => 'sent',
                'sent_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Invitation marked as sent via WhatsApp',
            'invitation' => $invitation
        ]);
    }

    /**
     * Create a new guest (admin only)
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:guests,email',
            'phone' => 'nullable|string|max:20',
            'group' => 'nullable|string|max:50',
            'plus_ones_allowed' => 'integer|min:0|max:10',
            'invitation_via' => 'nullable|string|in:whatsapp,email',
            'plus_ones_data' => 'nullable|array',
            'plus_ones_data.*.name' => 'required_with:plus_ones_data|string|max:255',
            'plus_ones_data.*.email' => 'nullable|email',
        ]);

        $guest = Guest::create($request->only([
            'name', 'email', 'phone', 'group', 'plus_ones_allowed', 'invitation_via'
        ]));

        // Create pending invitation for primary guest
        Invitation::create([
            'guest_id' => $guest->id,
            'status' => 'pending',
        ]);

        // Create plus one guest records if provided
        if ($request->has('plus_ones_data') && is_array($request->plus_ones_data)) {
            foreach ($request->plus_ones_data as $plusOneData) {
                if (!empty($plusOneData['name'])) {
                    $plusOne = Guest::create([
                        'name' => $plusOneData['name'],
                        'email' => $plusOneData['email'] ?? null,
                        'group' => $guest->group,
                        'parent_guest_id' => $guest->id,
                        'plus_ones_allowed' => 0,
                    ]);
                    
                    // Create invitation for plus one
                    Invitation::create([
                        'guest_id' => $plusOne->id,
                        'status' => 'pending',
                    ]);
                }
            }
        }

        return response()->json($guest->load(['invitation', 'plusOnes.invitation']), 201);
    }

    /**
     * Update a guest (admin only)
     */
    public function update(Request $request, Guest $guest)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:guests,email,' . $guest->id,
            'phone' => 'nullable|string|max:20',
            'group' => 'nullable|string|max:50',
            'plus_ones_allowed' => 'integer|min:0|max:10',
            'invitation_via' => 'nullable|string|in:whatsapp,email',
            'plus_ones_data' => 'nullable|array',
            'plus_ones_data.*.id' => 'nullable|integer',
            'plus_ones_data.*.name' => 'required_with:plus_ones_data|string|max:255',
            'plus_ones_data.*.email' => 'nullable|email',
        ]);

        $guest->update($request->only([
            'name', 'email', 'phone', 'group', 'plus_ones_allowed', 'invitation_via'
        ]));

        // Sync plus ones if provided
        if ($request->has('plus_ones_data')) {
            $existingIds = [];
            
            foreach ($request->plus_ones_data as $plusOneData) {
                if (!empty($plusOneData['name'])) {
                    if (!empty($plusOneData['id'])) {
                        // Update existing plus one
                        $plusOne = Guest::find($plusOneData['id']);
                        if ($plusOne && $plusOne->parent_guest_id === $guest->id) {
                            $plusOne->update([
                                'name' => $plusOneData['name'],
                                'email' => $plusOneData['email'] ?? null,
                            ]);
                            $existingIds[] = $plusOne->id;
                        }
                    } else {
                        // Create new plus one
                        $plusOne = Guest::create([
                            'name' => $plusOneData['name'],
                            'email' => $plusOneData['email'] ?? null,
                            'group' => $guest->group,
                            'parent_guest_id' => $guest->id,
                            'plus_ones_allowed' => 0,
                        ]);
                        
                        Invitation::create([
                            'guest_id' => $plusOne->id,
                            'status' => 'pending',
                        ]);
                        
                        $existingIds[] = $plusOne->id;
                    }
                }
            }
            
            // Remove plus ones that are no longer in the list
            $guest->plusOnes()->whereNotIn('id', $existingIds)->delete();
        }

        return response()->json($guest->load(['invitation', 'plusOnes.invitation']));
    }

    /**
     * Delete a guest (admin only)
     */
    public function destroy(Guest $guest)
    {
        $guest->delete();
        return response()->json(['message' => 'Guest deleted successfully']);
    }

    /**
     * Get statistics (admin only)
     */
    public function statistics()
    {
        $total = Guest::count();
        $attending = Guest::where('rsvp_status', 'confirmed')->count();
        $declined = Guest::where('rsvp_status', 'declined')->count();
        $pending = Guest::where('rsvp_status', 'pending')->count();
        
        $totalGuests = Guest::where('rsvp_status', 'confirmed')
            ->sum(DB::raw('1 + confirmed_plus_ones'));

        $recent = Guest::whereHas('rsvpResponse')
            ->with('rsvpResponse')
            ->latest('updated_at')
            ->limit(5)
            ->get()
            ->map(function($g) {
                return [
                    'name' => $g->name,
                    'attending' => $g->rsvpResponse->attending,
                    'updated_at' => $g->rsvpResponse->updated_at
                ];
            });

        return response()->json([
            'total' => $total,
            'attending' => $attending,
            'declined' => $declined,
            'pending' => $pending,
            'total_guests' => $totalGuests,
            'recent' => $recent,
        ]);
    }
    /**
     * Export guests (admin only)
     */
    public function export()
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="guests.csv"',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');
            
            // Header
            fputcsv($file, ['Name', 'Email', 'Group', 'Status', 'Invitation Via', 'Plus Ones', 'Message']);

            // Data
            Guest::with('rsvpResponse')->cursor()->each(function ($guest) use ($file) {
                fputcsv($file, [
                    $guest->name,
                    $guest->email,
                    $guest->group,
                    $guest->rsvp_response ? ($guest->rsvp_response->attending ? 'Attending' : 'Declined') : 'Pending',
                    $guest->invitation_via,
                    $guest->rsvp_response ? $guest->rsvp_response->plus_ones_count : 0,
                    $guest->rsvp_response ? $guest->rsvp_response->message : '',
                ]);
            });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Import guests from Excel (admin only)
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240', // Max 10MB
        ]);

        try {
            Excel::import(new GuestsImport, $request->file('file'));
            return response()->json(['message' => 'Guests imported successfully'], 200);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Guest Import Error: ' . $e->getMessage());
            \Illuminate\Support\Facades\Log::error($e->getTraceAsString());
            return response()->json(['message' => 'Failed to import guests', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Validate import and find conflicts
     */
    public function validateImport(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240',
        ]);

        try {
            $data = Excel::toArray(new GuestsImport, $request->file('file'));
            $rows = $data[0] ?? [];

            $conflicts = [];
            $valid = [];
            $skippedCount = 0;

            foreach ($rows as $row) {
                if (empty($row['names']) && empty($row['name'])) {
                    $skippedCount++;
                    continue;
                }

                $name = trim($row['names'] ?? $row['name'] ?? '');
                $email = !empty($row['email']) ? trim($row['email']) : null;
                $phone = !empty($row['telphone_number']) ? trim($row['telphone_number']) : null;
                $method = !empty($row['save_the_date_sent_via_whatsappemail']) ? trim($row['save_the_date_sent_via_whatsappemail']) : null;
                $invitation_via = !empty($row['invitation_via']) ? trim($row['invitation_via']) : null;
                $group = !empty($row['group']) ? trim($row['group']) : 'Invited';
                $plusOnes = max(0, ((int)($row['number_of_invites'] ?? 1)) - 1);

                $existing = null;
                if ($email) {
                    $existing = Guest::where('email', $email)->first();
                }
                if (!$existing && $name) {
                    $existing = Guest::where('name', $name)->first();
                }

                $newGuestData = [
                    'name' => $name,
                    'email' => $email,
                    'phone' => $phone,
                    'plus_ones_allowed' => $plusOnes,
                    'save_the_date_method' => $method,
                    'invitation_via' => $invitation_via,
                    'group' => $group,
                    'rsvp_status' => 'pending',
                ];

                if ($existing) {
                    // Check if data is actually different
                    $isDifferent = (
                        $existing->name != $name || 
                        $existing->email != $email || 
                        $existing->phone != $phone || 
                        $existing->plus_ones_allowed != $plusOnes ||
                        $existing->save_the_date_method != $method
                    );

                    if ($isDifferent) {
                        $conflicts[] = [
                            'existing' => $existing,
                            'new' => $newGuestData
                        ];
                    } else {
                        $skippedCount++;
                    }
                } else {
                    $valid[] = $newGuestData;
                }
            }

            return response()->json([
                'conflicts' => $conflicts,
                'valid' => $valid,
                'skipped_count' => $skippedCount
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Validation failed', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Finalize import with resolutions
     */
    public function importConfirm(Request $request)
    {
        $request->validate([
            'valid' => 'array',
            'conflicts' => 'array',
        ]);

        $results = ['created' => 0, 'updated' => 0, 'skipped' => 0];

        try {
            DB::transaction(function () use ($request, &$results) {
                // 1. Process new valid guests
                if ($request->has('valid')) {
                    foreach ($request->valid as $data) {
                        $plusOnesCount = (int)($data['plus_ones_allowed'] ?? 0);
                        
                        // Create primary guest
                        $guest = Guest::create($data + ['plus_ones_allowed' => 0, 'rsvp_status' => 'pending']);
                        Invitation::create(['guest_id' => $guest->id, 'status' => 'pending']);
                        $results['created']++;

                        // Create dedicated plus-one records
                        for ($i = 1; $i <= $plusOnesCount; $i++) {
                            $po = Guest::create([
                                'name' => $guest->name . " (Plus One " . $i . ")",
                                'group' => $guest->group,
                                'parent_guest_id' => $guest->id,
                                'plus_ones_allowed' => 0,
                                'rsvp_status' => 'pending',
                            ]);
                            Invitation::create(['guest_id' => $po->id, 'status' => 'pending']);
                            $results['created']++;
                        }
                    }
                }

                // 2. Process conflicts based on user resolution
                if ($request->has('conflicts')) {
                    foreach ($request->conflicts as $conflict) {
                        $resolution = $conflict['resolution'] ?? 'skip';
                        $existingId = $conflict['existing']['id'] ?? null;
                        
                        if (!$existingId) continue;

                        $guest = Guest::find($existingId);
                        if (!$guest) continue;

                        if ($resolution === 'overwrite') {
                            $guest->update($conflict['new']);
                            $results['updated']++;
                        } elseif ($resolution === 'merge') {
                            $guest->update(array_filter($conflict['new']));
                            $results['updated']++;
                        } else {
                            $results['skipped']++;
                        }
                    }
                }
            });

            return response()->json([
                'message' => 'Import completed',
                'results' => $results
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Import failed', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Bulk update guests (admin only)
     */
    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:guests,id',
            'data' => 'required|array',
        ]);

        $ids = $request->ids;
        $data = $request->data;
        
        // Only allow updating specific fields in bulk for safety
        $allowedFields = ['group', 'invitation_via', 'rsvp_status', 'plus_ones_allowed'];
        $updateData = array_intersect_key($data, array_flip($allowedFields));

        if (empty($updateData)) {
            return response()->json(['message' => 'No valid fields provided for update'], 400);
        }

        Guest::whereIn('id', $ids)->update($updateData);

        return response()->json([
            'message' => count($ids) . ' guests updated successfully',
        ]);
    }

    /**
     * Reset a single guest's RSVP status (admin only)
     */
    public function resetRsvp(Guest $guest)
    {
        $guest->update([
            'rsvp_status' => 'pending',
            'confirmed_plus_ones' => 0,
        ]);

        // Reset all plus ones too
        $guest->plusOnes()->update([
            'rsvp_status' => 'pending',
            'confirmed_plus_ones' => 0,
        ]);

        // Delete the RSVP response if it exists
        $guest->rsvpResponse()->delete();
        
        // Also delete responses for plus ones
        RsvpResponse::whereIn('guest_id', $guest->plusOnes()->pluck('id'))->delete();

        return response()->json([
            'message' => 'RSVP reset successfully for ' . $guest->name . ' and their plus ones.',
            'guest' => new GuestResource($guest->fresh(['rsvpResponse', 'invitation', 'plusOnes']))
        ]);
    }
}
