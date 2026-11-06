<?php

namespace App\Http\Controllers\Api;

use App\Events\PolaroidImageCreated;
use App\Http\Controllers\Controller;
use App\Models\PolaroidImage;
use App\Models\PolaroidReaction;
use App\Models\PolaroidView;
use App\Services\ImageOptimizer;
use App\Traits\AdminNotifiable;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class PolaroidImageController extends Controller
{
    use AdminNotifiable, ApiResponse;

    /** The reactions a story offers — one bounded set, UI and API agree. */
    public const REACTIONS = ['❤️', '😂', '👏', '🔥', '😮', '😍', '🎉', '🥳'];

    public function index(Request $request)
    {
        $query = PolaroidImage::query();

        if ($request->has('date')) {
            $query->whereDate('taken_at', $request->date);
        }

        $viewerCode = trim((string) $request->query('guest_code')) ?: null;

        $items = $query->with('reactions')->latest('taken_at')->get()->map(function (PolaroidImage $polaroid) use ($viewerCode) {
            return array_merge(
                $polaroid->makeHidden('reactions')->toArray(),
                ['reactions' => $polaroid->reactionsSummary($viewerCode)],
            );
        });

        return $this->successResponse($items);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ImageOptimizer::RULE,
        ]);

        if ($request->hasFile('image')) {
            $path = ImageOptimizer::optimize($request->file('image'))->store('polaroids', 'public');

            $polaroid = PolaroidImage::create([
                'image_path' => '/storage/'.$path,
            ]);

            return $this->createdResponse($polaroid);
        }

        return $this->errorResponse('No image uploaded', 400);
    }

    public function storeLive(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ImageOptimizer::RULE,
            'title' => 'nullable|string|max:255',
            'caption' => 'nullable|string|max:500',
            'taken_at' => 'nullable|date',
            'location' => 'nullable|string|max:255',
        ]);

        $path = ImageOptimizer::optimize($request->file('image'))->store('polaroids', 'public');

        $polaroid = PolaroidImage::create([
            'image_path' => '/storage/'.$path,
            'title' => $request->title,
            'caption' => $request->caption,
            'taken_at' => $request->taken_at ?? now(),
            'location' => $request->location,
        ]);

        event(new PolaroidImageCreated($polaroid));

        return $this->createdResponse($polaroid);
    }

    /**
     * Snap Studio: several photos in one request (a burst). Each is stored
     * optimised and posted to the story feed under the guest's name.
     */
    public function storeBatch(Request $request): JsonResponse
    {
        $request->validate([
            'images' => 'required|array|min:1|max:10',
            'images.*' => ImageOptimizer::RULE,
            'guest_name' => 'required|string|max:100',
            'guest_code' => 'nullable|string|max:64',
            'caption' => 'nullable|string|max:500',
            // Optional per-photo captions, aligned with `images` by index;
            // anything without one falls back to the batch `caption`.
            'captions' => 'nullable|array|max:10',
            'captions.*' => 'nullable|string|max:500',
            'location' => 'nullable|string|max:255',
        ]);

        $created = [];

        foreach ($request->file('images') as $index => $file) {
            $path = ImageOptimizer::optimize($file)->store('polaroids', 'public');

            $polaroid = PolaroidImage::create([
                'image_path' => '/storage/'.$path,
                'caption' => $request->captions[$index] ?? $request->caption,
                'location' => $request->location,
                'guest_name' => $request->guest_name,
                'guest_code' => $request->guest_code,
                'taken_at' => now(),
            ]);

            event(new PolaroidImageCreated($polaroid));
            $created[] = $polaroid;
        }

        return $this->createdResponse($created, count($created).' photo(s) shared to the story');
    }

    /**
     * Everything grouped into per-author stories, newest story first and
     * oldest → newest inside each, so playback runs forward.
     *
     * Pass `?guest_code=` to have each item's `reactions.mine` filled in.
     */
    public function stories(Request $request): JsonResponse
    {
        $viewerCode = trim((string) $request->query('guest_code')) ?: null;

        $items = PolaroidImage::with('reactions')->withCount('views')->orderBy('taken_at')->orderBy('id')->get();

        $grouped = $items->groupBy(fn (PolaroidImage $polaroid) => $polaroid->guest_code ?: 'couple');

        $stories = [];
        foreach ($grouped as $key => $group) {
            $isCouple = $key === 'couple';

            $stories[] = [
                'key' => $isCouple ? 'couple' : 'g:'.substr(sha1((string) $key), 0, 12),
                'author' => $group->first()->guest_name ?: 'The couple',
                'is_couple' => $isCouple,
                'items' => $group
                    ->map(fn (PolaroidImage $polaroid) => $this->storyItem($polaroid, $viewerCode))
                    ->values()
                    ->all(),
                'latest_at' => (string) ($group->last()->taken_at ?: $group->last()->created_at),
            ];
        }

        usort($stories, fn (array $a, array $b) => strcmp($b['latest_at'], $a['latest_at']));

        return $this->successResponse([
            'stories' => $stories,
            'total' => $items->count(),
        ]);
    }

    /** Tap an emoji on a story post; tapping another emoji changes it. */
    public function react(Request $request, PolaroidImage $polaroid): JsonResponse
    {
        $request->validate([
            'emoji' => ['required', 'string', 'max:16', Rule::in(self::REACTIONS)],
            'guest_name' => 'nullable|string|max:100',
            'guest_code' => 'nullable|string|max:64',
        ]);

        $guestCode = $request->guest_code ?: null;
        $guestName = $request->guest_name ?: null;

        $reaction = PolaroidReaction::updateOrCreate(
            $guestCode
                ? ['polaroid_image_id' => $polaroid->id, 'guest_code' => $guestCode]
                : ['polaroid_image_id' => $polaroid->id, 'guest_code' => null, 'guest_name' => $guestName],
            ['emoji' => $request->emoji, 'guest_name' => $guestName],
        );

        // A brand-new tap is worth a bell ping; changing your mind isn't.
        if ($reaction?->wasRecentlyCreated) {
            $this->notifyAdmin(
                'PolaroidReaction',
                'Someone reacted to a photo',
                ($guestName ?: 'A guest').' reacted '.$request->emoji.' to a photo in Captured Moments',
                'camera',
            );
        }

        return $this->successResponse(
            $polaroid->fresh(['reactions'])->reactionsSummary($guestCode),
            'Reaction saved',
        );
    }

    /** Untap: removes this viewer's reaction from the story post. */
    public function unreact(Request $request, PolaroidImage $polaroid): JsonResponse
    {
        $request->validate([
            'guest_code' => 'nullable|string|max:64',
            'guest_name' => 'nullable|string|max:100',
        ]);

        $guestCode = trim((string) ($request->input('guest_code') ?: '')) ?: null;
        $guestName = $request->input('guest_name') ?: null;

        $query = PolaroidReaction::where('polaroid_image_id', $polaroid->id);
        $query = $guestCode
            ? $query->where('guest_code', $guestCode)
            : $query->whereNull('guest_code')->where('guest_name', $guestName);

        $query->first()?->delete();

        return $this->successResponse(
            $polaroid->fresh(['reactions'])->reactionsSummary($guestCode),
            'Reaction removed',
        );
    }

    /** One story item: everything the viewer needs, timestamps in ISO form. */
    private function storyItem(PolaroidImage $polaroid, ?string $viewerCode): array
    {
        return [
            'id' => $polaroid->id,
            'image' => $polaroid->full_image_url,
            'image_path' => $polaroid->image_path,
            'title' => $polaroid->title,
            'caption' => $polaroid->caption,
            'location' => $polaroid->location,
            'author' => $polaroid->guest_name ?: 'The couple',
            'taken_at' => $polaroid->taken_at ? Carbon::parse($polaroid->taken_at)->toIso8601String() : null,
            'reactions' => $polaroid->reactionsSummary($viewerCode),
            'views' => (int) ($polaroid->views_count ?? $polaroid->views()->count()),
        ];
    }

    /**
     * Record that a device watched a photo (the "seen by" count the couple
     * sees on a story). Replays update the same row rather than counting.
     */
    public function viewed(Request $request, PolaroidImage $polaroid): JsonResponse
    {
        $request->validate([
            'guest_code' => 'required_without:guest_name|nullable|string|max:64',
            'guest_name' => 'required_without:guest_code|nullable|string|max:100',
        ]);

        $guestCode = $request->guest_code ?: null;
        $guestName = $request->guest_name ?: null;

        PolaroidView::updateOrCreate(
            $guestCode
                ? ['polaroid_image_id' => $polaroid->id, 'guest_code' => $guestCode]
                : ['polaroid_image_id' => $polaroid->id, 'guest_code' => null, 'guest_name' => $guestName],
            ['guest_name' => $guestName],
        );

        return $this->successResponse([
            'views' => $polaroid->views()->count(),
            'viewed' => true,
        ]);
    }

    public function update(Request $request, PolaroidImage $polaroid): JsonResponse
    {
        $polaroid->update($request->only([
            'title',
            'caption',
            'note',
            'custom_size',
            'offset_x',
            'offset_y',
            'rotation',
            'location',
            'taken_at',
        ]));

        return $this->successResponse($polaroid);
    }

    public function destroy(PolaroidImage $polaroid): JsonResponse
    {
        $relativePath = str_replace('/storage/', '', $polaroid->image_path);

        if (Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }

        $polaroid->delete();

        return $this->deletedResponse('Deleted successfully');
    }
}
