<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\Drivers\Imagick\Driver as ImagickDriver;
use Intervention\Image\Encoders\AvifEncoder;
use Intervention\Image\Encoders\GifEncoder;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\Encoders\PngEncoder;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;
use Intervention\Image\Interfaces\EncoderInterface;

/**
 * Normalise every photo the app accepts, server-side.
 *
 *  - EXIF auto-orient (phone photos arrive rotated)
 *  - downscaled to MAX_DIMENSION so full-resolution phone shots stay cheap
 *  - re-encoded, which strips EXIF metadata — guests' GPS never travels with
 *    a wedding photo
 *  - HEIC/HEIF from iPhones converted to JPEG (imagick supports it here), so
 *    guests never hit "file type not accepted"
 *
 * Anything it cannot decode — SVG, an animated GIF, an unsupported driver —
 * comes back untouched: a failed optimisation must never block an upload.
 *
 * Imagick is used when it is loaded (it is on the VPS: HEIC, better quality),
 * GD otherwise, so the same guarantees hold on any host.
 */
final class ImageOptimizer
{
    /** Validation ceiling for image uploads, in kilobytes. */
    public const MAX_UPLOAD_KB = 20480;

    /** Longest edge in pixels after optimisation. */
    public const MAX_DIMENSION = 2480;

    /** JPEG / WebP / AVIF quality. */
    public const QUALITY = 82;

    /**
     * The rule every image upload uses: content-sniffed formats (HEIC and
     * HEIF included) and the size ceiling above.
     */
    public const RULE = 'required|file|mimetypes:'
        .'image/jpeg,image/png,image/bmp,image/gif,image/webp,image/avif,'
        .'image/svg+xml,image/heic,image/heif,'
        .'|max:'.self::MAX_UPLOAD_KB;

    /** Lower-cased client extension => format written out. */
    private const FORMATS = [
        'jpg' => 'jpg',
        'jpeg' => 'jpg',
        'png' => 'png',
        'bmp' => 'png', // lossless and far smaller than bitmap
        'webp' => 'webp',
        'avif' => 'avif',
        'gif' => 'gif',
        'heic' => 'jpg',
        'heif' => 'jpg',
    ];

    /**
     * Optimise an uploaded image and hand back a file ready to store.
     * The returned file carries the *output* extension and mime type, so
     * callers that name files from the client name (e.g. MediaController)
     * never write JPEG bytes into a .heic file.
     */
    public static function optimize(
        UploadedFile $file,
        int $maxDimension = self::MAX_DIMENSION,
        int $quality = self::QUALITY,
    ): UploadedFile {
        if (! $file->isValid()) {
            return $file;
        }

        $format = self::FORMATS[strtolower($file->getClientOriginalExtension())] ?? null;
        if ($format === null) {
            return $file; // SVG or something unknown — leave the bytes alone
        }

        try {
            $driver = class_exists(\Imagick::class) ? ImagickDriver::class : GdDriver::class;
            $image = ImageManager::usingDriver($driver)->decodePath($file->getRealPath());

            if ($image->isAnimated()) {
                return $file; // keep animated GIFs animated
            }

            $image->orient();
            $image->scaleDown(width: $maxDimension, height: $maxDimension);
            $encoded = $image->encode(self::encoder($format, $quality));

            $name = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME).'.'.$format;
            $path = sys_get_temp_dir().DIRECTORY_SEPARATOR.bin2hex(random_bytes(12)).'.'.$format;
            file_put_contents($path, (string) $encoded);

            return new UploadedFile($path, $name, $encoded->mimetype(), null, true);
        } catch (\Throwable $e) {
            // Never block an upload because optimisation failed — but say why.
            \Illuminate\Support\Facades\Log::warning('Image optimisation skipped: '.$e->getMessage());

            return $file;
        }
    }

    private static function encoder(string $format, int $quality): EncoderInterface
    {
        return match ($format) {
            'jpg' => new JpegEncoder(quality: $quality, strip: true),
            'webp' => new WebpEncoder(quality: $quality, strip: true),
            'avif' => new AvifEncoder(quality: $quality, strip: true),
            'png' => new PngEncoder(strip: true),
            default => new GifEncoder,
        };
    }
}
