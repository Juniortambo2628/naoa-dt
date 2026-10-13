<?php

use App\Models\Guest;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Merge case/spacing variants of guest groups ("family" / "Family "). */
    public function up(): void
    {
        DB::table('guests')
            ->select('group')
            ->distinct()
            ->pluck('group')
            ->each(function ($group) {
                $normalized = Guest::normalizeGroup($group);
                if ($normalized !== $group) {
                    DB::table('guests')->where('group', $group)->update(['group' => $normalized]);
                }
            });
    }

    public function down(): void
    {
        // Irreversible data clean-up; original spellings are not kept.
    }
};
