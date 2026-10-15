<?php

namespace App\Models;

use App\Models\Concerns\RecordsRevisions;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use RecordsRevisions;

    protected $fillable = ['key', 'value', 'group'];

    /** Settings edited outside the Settings page, by the admin module that edits them. */
    private const MODULE_KEYS = [
        'invitation_theme' => 'design',
        'save_the_date_theme' => 'design',
    ];

    /** "wedding_date" -> "Wedding date" in the version history. */
    public function revisionLabel(): string
    {
        return ucfirst(str_replace('_', ' ', (string) $this->key));
    }

    public function revisionModule(array $changed = []): string
    {
        if (isset(self::MODULE_KEYS[$this->key])) {
            return self::MODULE_KEYS[$this->key];
        }

        return str_starts_with((string) $this->key, 'email_') ? 'emails' : 'settings';
    }

    public static function getValue($key, $default = null)
    {
        $setting = self::where('key', $key)->first();

        return $setting ? $setting->value : $default;
    }
}
