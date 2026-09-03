<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guest;
use App\Models\Invitation;
use App\Services\GuestImportService;
use App\Services\GuestService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Resources\GuestResource;

class GuestController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly GuestImportService $importService
    ) {}
    /**
     * Get shared validation rules for guest create/update.
     */
    private function guestValidationRules(?Guest $guest = null): array
    {
        $uniqueEmail = $guest
            ? 'nullable|email|unique:guests,email,' . $guest->id
            : 'nullable|email|unique:guests,email';

        return [
            'name' => 'required|string|max:255',
            'email' => $uniqueEmail,
            'phone' => 'nullable|string|max:20',
            'group' => 'nullable|string|max:50',
            'plus_ones_allowed' => 'integer|min:0|max:10',
            'invitation_via' => 'nullable|string|in:whatsapp,email',
            'plus_ones_data' => 'nullable|array',
            'plus_ones_data.*.id' => 'nullable|integer',
            'plus_ones_data.*.name' => 'required_with:plus_ones_data|string|max:255',
            'plus_ones_data.*.email' => 'nullable|email',
        ];
    }

    /**
     * Get all guests (admin only)
     */
    public function index(Request $request)
    {
        // Only show primary guests (not plus-ones) with their plus ones included
        /** @var \Illuminate\Database\Eloquent\Builder $query */
        $query = Guest::with(['invitation', 'parentGuest', 'plusOnes.invitation']);

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

        return GuestResource::collection($query->latest()->get());
    }

    /**
     * Get guest by unique code (public)
     */
    public function getByCode(string $code)
    {
        $guest = Guest::with(['invitation', 'plusOnes', 'table.guests'])
            ->where('unique_code', strtoupper($code))
            ->first();

        if (!$guest) {
            return $this->notFoundResponse('Guest not found');
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

        return $this->successResponse($guest);
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
            return $this->notFoundResponse('Guest not found');
        }

        $result = $guestService->submitRsvp($guest, $request->all());

        if (!$result['success']) {
            return $this->errorResponse($result['message'], 500, ['error' => $result['error']]);
        }

        return $this->successResponse([
            'guest' => new GuestResource($guest->fresh()),
        ], $result['message']);
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

        return $this->successResponse([
            'invitation' => $invitation
        ], 'Invitation marked as sent via WhatsApp');
    }

    /**
     * Create a new guest (admin only)
     */
    public function store(Request $request)
    {
        $request->validate($this->guestValidationRules());

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

        return $this->createdResponse($guest->load(['invitation', 'plusOnes.invitation']));
    }

    /**
     * Update a guest (admin only)
     */
    public function update(Request $request, Guest $guest)
    {
        $request->validate($this->guestValidationRules($guest));

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

        return $this->successResponse($guest->load(['invitation', 'plusOnes.invitation']));
    }

    /**
     * Delete a guest (admin only)
     */
    public function destroy(Guest $guest)
    {
        $guest->delete();
        return $this->deletedResponse('Guest deleted successfully');
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
        
        // Accurate headcount: Every record in Guest table that is 'confirmed'
        // This includes primary guests and their plus-ones if they have separate records
        $totalGuests = $attending;

        $recent = Guest::where('rsvp_status', '!=', 'pending')
            ->latest('updated_at')
            ->limit(5)
            ->get()
            ->map(function($g) {
                return [
                    'name' => $g->name,
                    'attending' => $g->rsvp_status === 'confirmed',
                    'updated_at' => $g->updated_at
                ];
            });

        return $this->successResponse([
            'total' => $total,
            'attending' => $attending,
            'declined' => $declined,
            'pending' => $pending,
            'total_guests' => $totalGuests,
            'recent' => $recent,
        ]);
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
            $this->importService->import($request->file('file'));
            return $this->successResponse(null, 'Guests imported successfully');
        } catch (\Exception $e) {
            Log::error('Guest Import Error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return $this->errorResponse('Failed to import guests', 500, ['error' => $e->getMessage()]);
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
            return $this->successResponse($this->importService->validateImport($request->file('file')));
        } catch (\Exception $e) {
            return $this->errorResponse('Validation failed', 500, ['error' => $e->getMessage()]);
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

        try {
            $results = $this->importService->confirmImport(
                $request->input('valid', []),
                $request->input('conflicts', [])
            );

            return $this->successResponse($results, 'Import completed');
        } catch (\Exception $e) {
            return $this->errorResponse('Import failed', 500, ['error' => $e->getMessage()]);
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
            return $this->errorResponse('No valid fields provided for update', 400);
        }

        Guest::whereIn('id', $ids)->update($updateData);

        return $this->successResponse(null, count($ids) . ' guests updated successfully');
    }

    /**
     * Reset a single guest's RSVP status (admin only)
     */
    public function resetRsvp(Guest $guest)
    {
        $guest->update([
            'rsvp_status' => 'pending',
            'rsvp_message' => null,
            'dietary_notes' => null,
        ]);

        // Reset all plus ones too
        $guest->plusOnes()->update([
            'rsvp_status' => 'pending',
            'dietary_notes' => null,
        ]);

        return $this->successResponse([
            'guest' => new GuestResource($guest->fresh(['invitation', 'plusOnes']))
        ], 'RSVP reset successfully for ' . $guest->name . ' and their plus ones.');
    }

    /**
     * Bulk resend confirmation emails (admin only)
     */
    public function resendConfirmationBulk(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:guests,id',
        ]);

        $guests = Guest::whereIn('id', $request->ids)->get();
        $count = 0;

        foreach ($guests as $guest) {
            if ($guest->email && $guest->rsvp_status !== 'pending') {
                try {
                    $isAttending = $guest->rsvp_status === 'confirmed';
                    \Illuminate\Support\Facades\Mail::to($guest->email)->send(new \App\Mail\RSVPConfirmation($guest, $isAttending));
                    $count++;
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Resend RSVP confirmation failed for ' . $guest->name . ': ' . $e->getMessage());
                }
            }
        }

        return $this->successResponse(null, "Confirmation emails sent to {$count} guests.");
    }
}
