<?php

namespace Tests\Feature;

use App\Services\ImageOptimizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

/**
 * Every image the app accepts is normalised server-side: EXIF auto-orient,
 * downscale to a sane edge, re-encode (which strips metadata), HEIC accepted
 * on hosts that can decode it — and a single20MB ceiling everywhere.
 */
class ImageOptimizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // GD test fixtures are large (multi-megapixel) and the whole suite
        // shares one process — give the image work room to breathe.
        ini_set('memory_limit', '512M');
    }

    public function test_a_large_photo_is_downscaled_and_kept_as_a_jpeg(): void
    {
        $source = UploadedFile::fake()->image('camera-roll.jpg', 3000, 2250);

        $optimized = ImageOptimizer::optimize($source);

        $this->assertFileExists($optimized->getRealPath());
        [$width, $height, $type] = getimagesize($optimized->getRealPath());

        $this->assertLessThanOrEqual(ImageOptimizer::MAX_DIMENSION, $width);
        $this->assertLessThanOrEqual(ImageOptimizer::MAX_DIMENSION, $height);
        $this->assertSame(IMAGETYPE_JPEG, $type);
        // The client name keeps a real image extension for callers that name
        // files from it (MediaController).
        $this->assertSame('jpg', $optimized->getClientOriginalExtension());
    }

    public function test_a_small_photo_still_comes_back_as_a_stored_file(): void
    {
        $source = UploadedFile::fake()->image('tiny.png', 320, 240);

        $optimized = ImageOptimizer::optimize($source);

        [$width, $height, $type] = getimagesize($optimized->getRealPath());
        $this->assertSame(320, $width);
        $this->assertSame(240, $height);
        $this->assertSame(IMAGETYPE_PNG, $type);
    }

    public function test_vectors_are_left_alone(): void
    {
        $svg = UploadedFile::fake()->createWithContent(
            'logo.svg',
            '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>'
        );

        $this->assertSame($svg, ImageOptimizer::optimize($svg));
    }

    public function test_the_shared_rule_accepts_phone_formats_and_caps_at_20mb(): void
    {
        $this->assertStringContainsString('image/heic', ImageOptimizer::RULE);
        $this->assertStringContainsString('image/heif', ImageOptimizer::RULE);
        $this->assertStringContainsString('image/svg+xml', ImageOptimizer::RULE);
        $this->assertStringContainsString('max:'.ImageOptimizer::MAX_UPLOAD_KB, ImageOptimizer::RULE);
        $this->assertSame(20480, ImageOptimizer::MAX_UPLOAD_KB);
    }

    public function test_guest_upload_stores_an_optimised_photo(): void
    {
        $response = $this->postJson('/api/gallery/guest-upload', [
            'image' => UploadedFile::fake()->image('camera-roll.jpg', 3000, 2250),
            'guest_name' => 'Kevin Omondi',
            'caption' => 'First dance',
        ]);

        $response->assertCreated();
        $url = $response->json('data.image_url');
        $this->assertNotEmpty($url);

        $stored = public_path(ltrim($url, '/'));
        $this->assertFileExists($stored);

        [$width] = getimagesize($stored);
        $this->assertLessThanOrEqual(ImageOptimizer::MAX_DIMENSION, $width);

        $this->assertDatabaseHas('gallery_items', ['image_url' => $url]);

        File::delete($stored);
    }

    public function test_an_upload_over_the_shared_ceiling_is_rejected(): void
    {
        $huge = UploadedFile::fake()->image('huge.jpg', 200, 200);
        // Real JPEG header (so content sniffing passes) padded over the limit:
        // only the size rule can reject this.
        file_put_contents(
            $huge->getPathname(),
            file_get_contents($huge->getPathname()).str_repeat('A', (ImageOptimizer::MAX_UPLOAD_KB + 1024) * 1024)
        );

        $this->postJson('/api/gallery/guest-upload', [
            'image' => $huge,
            'guest_name' => 'Kevin Omondi',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('image');
    }
}
