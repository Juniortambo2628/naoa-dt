<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BackupService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RuntimeException;

class BackupController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly BackupService $backups) {}

    public function index()
    {
        return $this->successResponse($this->backups->list());
    }

    public function store(Request $request)
    {
        $validated = $request->validate(['include_uploads' => 'sometimes|boolean']);

        return $this->guard(fn () => $this->createdResponse(
            $this->backups->create('manual', (bool) ($validated['include_uploads'] ?? false)),
            'Backup created'
        ));
    }

    public function download(string $name)
    {
        return $this->guard(fn () => response()->download($this->backups->path($name), $name, [
            'Content-Type' => 'application/zip',
        ]));
    }

    public function restore(string $name)
    {
        return $this->guard(function () use ($name) {
            $result = $this->backups->restore($name);

            return $this->successResponse(
                $result,
                "Restored {$result['restored_rows']} records. A safety backup ({$result['safety_backup']}) was taken first."
            );
        });
    }

    /** Restore into a throwaway in-memory database and compare row counts. */
    public function verify(string $name)
    {
        return $this->guard(function () use ($name) {
            $result = $this->backups->verify($name);

            if ($result['error'] !== null) {
                return $this->errorResponse("Verification failed: {$result['error']}", 422, $result);
            }

            return $this->successResponse(
                $result,
                $result['ok']
                    ? 'Backup verified: every table restored with the expected number of records.'
                    : 'Backup verification found tables that did not restore completely.'
            );
        });
    }

    public function destroy(string $name)
    {
        return $this->guard(function () use ($name) {
            $this->backups->path($name); // validates the name and existence
            $this->backups->delete($name);

            return $this->deletedResponse('Backup deleted');
        });
    }

    /** Map service errors to API responses. */
    private function guard(callable $action)
    {
        try {
            return $action();
        } catch (InvalidArgumentException $e) {
            return $this->notFoundResponse($e->getMessage());
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
