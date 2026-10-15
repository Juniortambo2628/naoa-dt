<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Role checks for the admin API.
 *
 *   ->middleware(EnforceRole::class)          viewers may only read
 *   ->middleware(EnforceRole::class.':owner') owners only
 */
class EnforceRole
{
    /**
     * Writes a viewer may still make: their own session, account security,
     * presence, and marking their notifications read.
     */
    private const VIEWER_WRITES = [
        'api/logout',
        'api/collaboration/heartbeat',
        'api/2fa/*',
        'api/notifications/mark-read',
    ];

    public function handle(Request $request, Closure $next, ?string $role = null): Response
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        if ($role === User::ROLE_OWNER && ! $user->isOwner()) {
            return $this->deny('Only owners can do this.');
        }

        if ($user->role === User::ROLE_VIEWER && ! $request->isMethodSafe() && ! $request->is(...self::VIEWER_WRITES)) {
            return $this->deny('You have view-only access.');
        }

        return $next($request);
    }

    private function deny(string $message): Response
    {
        return response()->json(['success' => false, 'message' => $message, 'reason' => 'role'], 403);
    }
}
