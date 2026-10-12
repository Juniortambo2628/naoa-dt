<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

/**
 * Guest polaroid uploads were saved to the "public" disk with an absolute
 * APP_URL-based URL, which broke when the storage symlink or APP_URL host
 * didn't match production. Move them under public/uploads and store a
 * relative path instead.
 */
return new class extends Migration
{
    public function up(): void
    {
        $targetDir = public_path('uploads/guest-uploads');
        File::ensureDirectoryExists($targetDir);

        DB::table('gallery_items')
            ->where('image_url', 'like', '%/storage/gallery/guest-uploads/%')
            ->orderBy('id')
            ->each(function ($item) use ($targetDir) {
                $filename = basename(parse_url($item->image_url, PHP_URL_PATH));
                $source = storage_path('app/public/gallery/guest-uploads/'.$filename);

                if (File::exists($source) && ! File::exists($targetDir.'/'.$filename)) {
                    File::copy($source, $targetDir.'/'.$filename);
                }

                DB::table('gallery_items')->where('id', $item->id)->update([
                    'image_url' => '/uploads/guest-uploads/'.$filename,
                ]);
            });
    }

    public function down(): void
    {
        //
    }
};
