<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

class GuestLimitExceededException extends RuntimeException
{
    public function __construct(
        public readonly int $limit,
        public readonly int $count,
        public readonly int $adding = 1,
    ) {
        $remaining = max(0, $limit - $count);
        $message = $remaining === 0
            ? "Guest limit reached: the list already has {$count} of {$limit} guests. Raise the limit in Settings to add more."
            : "Guest limit exceeded: adding {$adding} would take the list past {$limit} guests (only {$remaining} more allowed). Raise the limit in Settings to add more.";

        parent::__construct($message);
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'errors' => [
                'guest_limit' => [$this->getMessage()],
            ],
            'guest_limit' => $this->limit,
            'guest_count' => $this->count,
        ], 422);
    }
}
