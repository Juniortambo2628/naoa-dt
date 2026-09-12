<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmergencyNumber;
use Illuminate\Http\Request;

class EmergencyNumberController extends Controller
{
    public function index()
    {
        return EmergencyNumber::active()->ordered()->get();
    }

    public function show($id)
    {
        return EmergencyNumber::findOrFail($id);
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

        return EmergencyNumber::create($validated);
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

        return $emergencyNumber;
    }

    public function destroy($id)
    {
        EmergencyNumber::findOrFail($id)->delete();

        return response()->json(['message' => 'Emergency number deleted']);
    }
}
