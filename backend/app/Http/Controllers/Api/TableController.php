<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Table;
use App\Models\Guest;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TableController extends Controller
{
    use ApiResponse;

    public function index()
    {
        return response()->json(Table::with('guests')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string',
            'capacity' => 'required|integer|min:1',
            'type'     => 'required|in:round,rectangular',
            'x'        => 'integer',
            'y'        => 'integer',
            'width'    => 'integer',
            'height'   => 'integer',
        ]);

        $table = Table::create($data);

        return $this->createdResponse($table->load('guests'));
    }

    public function update(Request $request, Table $table): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'sometimes|string',
            'capacity' => 'sometimes|integer|min:1',
            'type'     => 'sometimes|in:round,rectangular',
            'x'        => 'sometimes|integer',
            'y'        => 'sometimes|integer',
            'width'    => 'sometimes|integer',
            'height'   => 'sometimes|integer',
        ]);

        $table->update($data);

        return $this->successResponse($table->load('guests'));
    }

    public function destroy(Table $table): JsonResponse
    {
        $table->delete();

        return $this->deletedResponse('Table deleted');
    }

    public function assignGuest(Request $request, Table $table): JsonResponse
    {
        $request->validate([
            'guest_id' => 'required|exists:guests,id',
        ]);

        $guest = Guest::findOrFail($request->guest_id);
        $guest->update(['table_id' => $table->id]);

        return $this->successResponse($table->load('guests'));
    }

    public function unassignGuest(Guest $guest): JsonResponse
    {
        $guest->update(['table_id' => null]);

        return $this->successResponse(null, 'Guest unassigned');
    }

    public function publicIndex()
    {
        return response()->json(
            Table::with(['guests' => fn($q) => $q->select('id', 'name', 'table_id')])->get()
        );
    }
}
