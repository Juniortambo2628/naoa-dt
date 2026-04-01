<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Table;
use App\Models\Guest;
use Illuminate\Http\Request;

class TableController extends Controller
{
    public function index()
    {
        return response()->json(Table::with('guests')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'capacity' => 'required|integer|min:1',
            'type' => 'required|in:round,rectangular',
            'x' => 'integer',
            'y' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ]);

        $table = Table::create($data);
        return response()->json($table->load('guests'), 201);
    }

    public function update(Request $request, Table $table)
    {
        $table->update($request->all());
        return response()->json($table->load('guests'));
    }

    public function destroy(Table $table)
    {
        $table->delete();
        return response()->json(['message' => 'Table deleted']);
    }

    public function assignGuest(Request $request, Table $table)
    {
        $request->validate([
            'guest_id' => 'required|exists:guests,id'
        ]);

        $guest = Guest::findOrFail($request->guest_id);
        $guest->update(['table_id' => $table->id]);

        return response()->json($table->load('guests'));
    }
    
    public function unassignGuest(Guest $guest)
    {
        $guest->update(['table_id' => null]);
        return response()->json(['message' => 'Guest unassigned']);
    }
}
