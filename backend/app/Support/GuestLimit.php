<?php

namespace App\Support;

use App\Exceptions\GuestLimitExceededException;
use App\Models\Guest;
use App\Models\Setting;

/**
 * The maximum number of guests, set on the admin Settings page (Guests card).
 * Every guest record counts — plus-ones included — since each is a seat.
 * An empty or zero `guest_limit` setting means no limit.
 */
class GuestLimit
{
    public const SETTING_KEY = 'guest_limit';

    public static function limit(): ?int
    {
        $value = (int) Setting::getValue(self::SETTING_KEY, 0);

        return $value > 0 ? $value : null;
    }

    public static function count(): int
    {
        return Guest::count();
    }

    /** Guests that can still be added, or null when there is no limit. */
    public static function remaining(): ?int
    {
        $limit = self::limit();

        return $limit === null ? null : max(0, $limit - self::count());
    }

    /**
     * Throw if adding $adding more guests would go over the limit.
     *
     * @throws GuestLimitExceededException
     */
    public static function ensureCanAdd(int $adding = 1): void
    {
        $limit = self::limit();
        if ($limit === null || $adding <= 0) {
            return;
        }

        $count = self::count();
        if ($count + $adding > $limit) {
            throw new GuestLimitExceededException($limit, $count, $adding);
        }
    }
}
