<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\CollaboratorInvitation;
use App\Models\Setting;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Working together in the admin dashboard:
 *   - heartbeat: who is on which page (presence) and which modules changed
 *     since you last looked (sidebar badges)
 *   - collaborators: invite people by email, list and remove them
 *   - accept: an invitee sets their password from the emailed link
 */
class CollaborationController extends Controller
{
    use ApiResponse;

    /** A collaborator counts as online this long after their last heartbeat. */
    public const ONLINE_SECONDS = 60;

    /** Invitation links stay valid this long. */
    public const INVITE_DAYS = 7;

    /** Modules that can show a "new changes" badge (keys match Revision::module). */
    public const BADGE_MODULES = [
        'guests', 'rsvps', 'seating', 'design', 'content', 'modules', 'gallery',
        'schedule', 'faqs', 'songs', 'guestbook', 'enquiries', 'gifts', 'settings', 'emails',
    ];

    public function heartbeat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module' => 'nullable|string|max:40|alpha_dash',
            'path' => 'nullable|string|max:255',
        ]);
        $user = $request->user();
        $module = $validated['module'] ?? null;

        $user->forceFill([
            'last_active_at' => now(),
            'current_module' => $module,
            'current_path' => $validated['path'] ?? null,
        ])->saveQuietly();

        $this->ensureVisits($user);
        if ($module) {
            DB::table('admin_module_visits')
                ->where('user_id', $user->id)->where('module', $module)
                ->update(['seen_at' => now()]);
        }

        return $this->successResponse([
            'presence' => $this->presence($user),
            'badges' => $this->badges($user),
        ]);
    }

    public function collaborators(Request $request): JsonResponse
    {
        $online = now()->subSeconds(self::ONLINE_SECONDS);

        return $this->successResponse(User::orderBy('name')->get()->map(fn (User $u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role,
            'is_you' => $u->is($request->user()),
            'pending' => $u->invited_by !== null && $u->invite_accepted_at === null,
            'online' => $u->last_active_at && $u->last_active_at->gt($online),
            'last_active_at' => $u->last_active_at,
            'current_module' => $u->current_module,
        ]));
    }

    public function invite(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'message' => 'nullable|string|max:1000',
            'role' => ['sometimes', Rule::in(User::ROLES)],
        ]);
        $role = $validated['role'] ?? User::ROLE_EDITOR;

        $existing = User::where('email', $validated['email'])->first();
        if ($existing && ($existing->invited_by === null || $existing->invite_accepted_at !== null)) {
            return $this->errorResponse('This person already has access.', 422);
        }

        // Re-inviting someone who hasn't accepted yet just sends a fresh link.
        $invitee = $existing ?? User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Str::password(32),
        ]);
        $invitee->forceFill(['invited_by' => $request->user()->id, 'role' => $role])->save();

        $token = Str::random(64);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $invitee->email],
            ['token' => Hash::make($token), 'created_at' => now()],
        );

        $link = $this->siteUrl().'/admin/accept-invite?'.http_build_query(['email' => $invitee->email, 'token' => $token]);

        $emailed = true;
        try {
            Mail::to($invitee->email)->send(new CollaboratorInvitation($invitee, $request->user(), $link, $validated['message'] ?? null));
        } catch (\Throwable $e) {
            Log::warning('Collaborator invitation email failed: '.$e->getMessage());
            $emailed = false;
        }

        return $this->createdResponse(
            ['id' => $invitee->id, 'invite_link' => $link, 'emailed' => $emailed, 'expires_in_days' => self::INVITE_DAYS],
            $emailed ? "Invitation sent to {$invitee->email}" : 'Invitation created — the email could not be sent, share the link instead',
        );
    }

    /** Owners change what a collaborator may do; there is always at least one owner. */
    public function updateRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate(['role' => ['required', Rule::in(User::ROLES)]]);

        $lastOwner = $user->isOwner()
            && ! User::where('role', User::ROLE_OWNER)->whereKeyNot($user->getKey())->exists();
        if ($lastOwner && $validated['role'] !== User::ROLE_OWNER) {
            return $this->errorResponse('At least one owner must remain', 422);
        }

        $user->forceFill(['role' => $validated['role']])->save();

        return $this->successResponse(['id' => $user->id, 'role' => $user->role], "{$user->name} is now a{$this->article($user->role)} {$user->role}");
    }

    private function article(string $role): string
    {
        return in_array($role[0], ['a', 'e', 'i', 'o', 'u'], true) ? 'n' : '';
    }

    public function accept(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $row = DB::table('password_reset_tokens')->where('email', $validated['email'])->first();
        $user = User::where('email', $validated['email'])->first();

        $valid = $row && $user
            && Hash::check($validated['token'], $row->token)
            && now()->subDays(self::INVITE_DAYS)->lt($row->created_at);
        if (! $valid) {
            return $this->errorResponse('This invitation link is invalid or has expired. Ask for a new one.', 422);
        }

        $user->forceFill([
            'password' => $validated['password'],
            'invite_accepted_at' => $user->invite_accepted_at ?? now(),
        ])->save();
        DB::table('password_reset_tokens')->where('email', $user->email)->delete();

        return $this->successResponse([
            'token' => $user->createToken('wedding-admin')->plainTextToken,
            'user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role],
        ], 'Welcome aboard!');
    }

    private function ensureVisits(User $user): void
    {
        $known = DB::table('admin_module_visits')->where('user_id', $user->id)->count();
        if ($known >= count(self::BADGE_MODULES)) {
            return;
        }

        // First time we see a module for this person: start counting from now,
        // so a new collaborator isn't greeted by the whole history as "new".
        DB::table('admin_module_visits')->insertOrIgnore(array_map(
            fn ($module) => ['user_id' => $user->id, 'module' => $module, 'seen_at' => now()],
            self::BADGE_MODULES,
        ));
    }

    /** Count of changes per module by anyone else since you last opened it. */
    private function badges(User $user): array
    {
        return DB::table('revisions as r')
            ->join('admin_module_visits as v', fn ($join) => $join->on('v.module', '=', 'r.module')->where('v.user_id', $user->id))
            ->whereColumn('r.updated_at', '>', 'v.seen_at')
            ->where(fn ($q) => $q->whereNull('r.user_id')->orWhere('r.user_id', '!=', $user->id))
            ->groupBy('r.module')
            ->pluck(DB::raw('count(*)'), 'r.module')
            ->map(fn ($count) => (int) $count)
            ->all();
    }

    private function presence(User $user): array
    {
        return User::where('id', '!=', $user->id)
            ->where('last_active_at', '>', now()->subSeconds(self::ONLINE_SECONDS))
            ->orderBy('name')
            ->get(['id', 'name', 'current_module', 'current_path', 'last_active_at'])
            ->toArray();
    }

    private function siteUrl(): string
    {
        return rtrim(Setting::getValue('public_url') ?: config('app.frontend_url'), '/');
    }
}
