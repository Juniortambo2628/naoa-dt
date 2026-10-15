<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    public const ROLE_OWNER = 'owner';

    public const ROLE_EDITOR = 'editor';

    public const ROLE_VIEWER = 'viewer';

    public const ROLES = [self::ROLE_OWNER, self::ROLE_EDITOR, self::ROLE_VIEWER];

    protected $fillable = [
        'name',
        'email',
        'role',
        'password',
        'two_factor_secret',
        'two_factor_confirmed_at',
        'two_factor_recovery_codes',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'last_active_at' => 'datetime',
            'invite_accepted_at' => 'datetime',
        ];
    }

    /**
     * Determine if the user has two-factor authentication enabled.
     */
    /**
     * What database cascades would do: the collaboration tables reference
     * users with plain columns (see the 2026_10_15 migration), so tidy up here.
     */
    protected static function booted(): void
    {
        static::deleting(function (User $user) {
            DB::table('revisions')->where('user_id', $user->id)->update(['user_id' => null]);
            DB::table('admin_module_visits')->where('user_id', $user->id)->delete();
            DB::table('users')->where('invited_by', $user->id)->update(['invited_by' => null]);
        });
    }

    public function isOwner(): bool
    {
        return $this->role === self::ROLE_OWNER;
    }

    public function is2faEnabled(): bool
    {
        return ! is_null($this->two_factor_confirmed_at);
    }
}
