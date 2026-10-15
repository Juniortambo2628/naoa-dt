<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
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
    public function isOwner(): bool
    {
        return $this->role === self::ROLE_OWNER;
    }

    public function is2faEnabled(): bool
    {
        return ! is_null($this->two_factor_confirmed_at);
    }
}
