<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Gift;
use App\Models\GiftClaim;
use Illuminate\Http\Request;

class GiftController extends Controller
{
    /**
     * Get all gifts (public)
     */
    public function index()
    {
        $gifts = Gift::where('is_available', true)
            ->with('claims')
            ->get();

        return response()->json($gifts);
    }

    /**
     * Claim a gift (public)
     */
    public function claim(Request $request, Gift $gift)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'amount' => 'nullable|numeric|min:1',
            'message' => 'nullable|string|max:500',
        ]);

        // Check if non-cash gift is already claimed
        if (!$gift->is_cash_fund && $gift->claims()->exists()) {
            return response()->json([
                'message' => 'This gift has already been reserved'
            ], 422);
        }

        $claim = GiftClaim::create([
            'gift_id' => $gift->id,
            'claimer_name' => $request->name,
            'claimer_email' => $request->email,
            'amount' => $gift->is_cash_fund ? $request->amount : $gift->price,
            'message' => $request->message,
        ]);

        // Send thank you email if claimer provided an email
        if ($claim->claimer_email) {
            \Illuminate\Support\Facades\Mail::to($claim->claimer_email)->send(new \App\Mail\GiftThankYou($claim->load('gift')));
        }

        // Record notification for admin
        \App\Models\Notification::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'type' => 'GiftClaimed',
            'notifiable_type' => 'App\Models\User',
            'notifiable_id' => 1,
            'data' => [
                'title' => 'New Gift Contribution',
                'message' => "{$claim->claimer_name} contributed to {$gift->name}",
                'icon' => 'gift'
            ]
        ]);

        return response()->json([
            'message' => $gift->is_cash_fund 
                ? 'Thank you for your contribution!' 
                : 'Gift reserved successfully!',
            'claim' => $claim,
        ], 201);
    }

    /**
     * Create a gift (admin)
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|url',
            'category' => 'nullable|string|max:50',
            'is_cash_fund' => 'boolean',
        ]);

        $gift = Gift::create($request->all());

        return response()->json($gift, 201);
    }

    /**
     * Update a gift (admin)
     */
    public function update(Request $request, Gift $gift)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|url',
            'product_link' => 'nullable|url',
            'category' => 'nullable|string|max:50',
            'is_cash_fund' => 'boolean',
            'is_available' => 'boolean',
        ]);

        $gift->update($request->all());

        return response()->json($gift);
    }

    /**
     * Delete a gift (admin)
     */
    public function destroy(Gift $gift)
    {
        $gift->delete();
        return response()->json(['message' => 'Gift deleted successfully']);
    }

    /**
     * Get gift statistics (admin)
     */
    public function statistics()
    {
        $totalGifts = Gift::count();
        $claimedGifts = Gift::whereHas('claims')
            ->where('is_cash_fund', false)
            ->count();
        $totalValue = GiftClaim::sum('amount');
        $cashFundTotal = Gift::where('is_cash_fund', true)
            ->withSum('claims', 'amount')
            ->get()
            ->sum('claims_sum_amount');

        return response()->json([
            'total_gifts' => $totalGifts,
            'claimed_gifts' => $claimedGifts,
            'total_value' => $totalValue,
            'cash_fund_total' => $cashFundTotal,
        ]);
    }
}
