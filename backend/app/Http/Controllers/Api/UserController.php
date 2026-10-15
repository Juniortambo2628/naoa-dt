<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Admin dashboard user management.
 */
class UserController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        return $this->successResponse(User::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => ['sometimes', Rule::in(User::ROLES)],
        ]);

        return $this->createdResponse(User::create($validated + ['role' => User::ROLE_EDITOR]));
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'role' => ['sometimes', Rule::in(User::ROLES)],
        ]);

        if (isset($validated['role']) && $validated['role'] !== User::ROLE_OWNER && $user->isOwner() && $this->isLastOwner($user)) {
            return $this->errorResponse('At least one owner must remain', 422);
        }

        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $user->update($validated);

        return $this->successResponse($user);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->is($user)) {
            return $this->errorResponse('You cannot delete your own account', 422);
        }

        if (User::count() <= 1) {
            return $this->errorResponse('At least one admin user must remain', 422);
        }

        if ($user->isOwner() && $this->isLastOwner($user)) {
            return $this->errorResponse('At least one owner must remain', 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return $this->deletedResponse('User deleted');
    }

    private function isLastOwner(User $user): bool
    {
        return ! User::where('role', User::ROLE_OWNER)->whereKeyNot($user->getKey())->exists();
    }
}
