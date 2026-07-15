<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Gift;
use App\Models\GiftClaim;
use App\Traits\AdminNotifiable;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;

class GiftController extends Controller
{
    use AdminNotifiable, ApiResponse;

    public function index()
    {
        $gifts = Gift::where('is_available', true)
            ->with('claims')
            ->get();

        return response()->json($gifts);
    }

    public function claim(Request $request, Gift $gift): JsonResponse
    {
        $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'nullable|email|max:255',
            'amount'  => 'nullable|numeric|min:1',
            'message' => 'nullable|string|max:500',
        ]);

        if (!$gift->is_cash_fund && $gift->claims()->exists()) {
            return $this->errorResponse('This gift has already been reserved', 422);
        }

        $claim = GiftClaim::create([
            'gift_id'        => $gift->id,
            'claimer_name'   => $request->name,
            'claimer_email'  => $request->email,
            'amount'         => $gift->is_cash_fund ? $request->amount : $gift->price,
            'message'        => $request->message,
        ]);

        if ($claim->claimer_email) {
            Mail::to($claim->claimer_email)->send(new \App\Mail\GiftThankYou($claim->load('gift')));
        }

        $this->notifyAdmin(
            'GiftClaimed',
            'New Gift Contribution',
            "{$claim->claimer_name} contributed to {$gift->name}",
            'gift'
        );

        return $this->createdResponse(
            $claim,
            $gift->is_cash_fund ? 'Thank you for your contribution!' : 'Gift reserved successfully!'
        );
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'         => 'required|string|max:255',
            'description'  => 'nullable|string',
            'price'        => 'nullable|numeric|min:0',
            'image_url'    => 'nullable|url',
            'category'     => 'nullable|string|max:50',
            'is_cash_fund' => 'boolean',
        ]);

        $gift = Gift::create($request->only([
            'name', 'description', 'price', 'image_url', 'category', 'is_cash_fund',
        ]));

        return $this->createdResponse($gift);
    }

    public function update(Request $request, Gift $gift): JsonResponse
    {
        $request->validate([
            'name'          => 'sometimes|string|max:255',
            'description'   => 'nullable|string',
            'price'         => 'nullable|numeric|min:0',
            'image_url'     => 'nullable|url',
            'product_link'  => 'nullable|url',
            'category'      => 'nullable|string|max:50',
            'is_cash_fund'  => 'boolean',
            'is_available'  => 'boolean',
        ]);

        $gift->update($request->only([
            'name', 'description', 'price', 'image_url', 'product_link', 'category', 'is_cash_fund', 'is_available',
        ]));

        return $this->successResponse($gift);
    }

    public function destroy(Gift $gift): JsonResponse
    {
        $gift->delete();

        return $this->deletedResponse('Gift deleted successfully');
    }

    public function statistics(): JsonResponse
    {
        $totalGifts = Gift::count();
        $claimedGifts = Gift::whereHas('claims')
            ->where('is_cash_fund', false)
            ->count();
        $totalValue = GiftClaim::sum('amount');
        $cashFundTotal = GiftClaim::whereHas('gift', fn($q) => $q->where('is_cash_fund', true))
            ->sum('amount');

        return $this->successResponse([
            'total_gifts'     => $totalGifts,
            'claimed_gifts'   => $claimedGifts,
            'total_value'     => $totalValue,
            'cash_fund_total' => $cashFundTotal,
        ]);
    }
}
