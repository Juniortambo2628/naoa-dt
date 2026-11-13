<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Role checks for the admin API.
 *
 *   ->middleware(EnforceRole::class)          viewers may only read; ushers may
 *                                             only read and check guests in
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

    /** Check-in writes an usher may make: scan, check in by name, undo. */
    private const USHER_WRITES = [
        '#^api/checkin/scan$#',
        '#^api/checkin/guests/\d+$#',
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

        if ($user->isUsher() && ! $request->isMethodSafe() && ! $request->is(...self::VIEWER_WRITES) && ! $this->isUsherWrite($request)) {
            return $this->deny('Ushers can only check guests in.');
        }

        return $next($request);
    }

    private function isUsherWrite(Request $request): bool
    {
        foreach (self::USHER_WRITES as $pattern) {
            if (preg_match($pattern, $request->path())) {
                return true;
            }
        }

        return false;
    }

    private function deny(string $message): Response
    {
        return response()->json(['success' => false, 'message' => $message, 'reason' => 'role'], 403);
    }
}
