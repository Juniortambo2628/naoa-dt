<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmergencyNumber;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class EmergencyNumberController extends Controller
{
    use ApiResponse;

    public function index()
    {
        return $this->successResponse(EmergencyNumber::active()->ordered()->get());
    }

    public function show($id)
    {
        return $this->successResponse(EmergencyNumber::findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'number' => 'required|string|max:50',
            'description' => 'nullable|string|max:500',
            'category' => 'required|string|in:general,police,medical,fire,tourism,support',
            'icon' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        return $this->createdResponse(EmergencyNumber::create($validated));
    }

    public function update(Request $request, $id)
    {
        $emergencyNumber = EmergencyNumber::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'number' => 'required|string|max:50',
            'description' => 'nullable|string|max:500',
            'category' => 'required|string|in:general,police,medical,fire,tourism,support',
            'icon' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $emergencyNumber->update($validated);

        return $this->successResponse($emergencyNumber);
    }

    public function destroy($id)
    {
        EmergencyNumber::findOrFail($id)->delete();

        return $this->deletedResponse('Emergency number deleted');
    }
}
