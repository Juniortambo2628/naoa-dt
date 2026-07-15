<?php

namespace App\Traits;

trait ApiResponse
{
    protected function successResponse(mixed $data = null, string $message = 'Success', int $code = 200): \Illuminate\Http\JsonResponse
    {
        $response = ['success' => true, 'message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        return response()->json($response, $code);
    }

    protected function createdResponse(mixed $data = null, string $message = 'Created successfully'): \Illuminate\Http\JsonResponse
    {
        return $this->successResponse($data, $message, 201);
    }

    protected function deletedResponse(string $message = 'Deleted successfully'): \Illuminate\Http\JsonResponse
    {
        return response()->json(['success' => true, 'message' => $message], 200);
    }

    protected function noContentResponse(string $message = 'Deleted successfully'): \Illuminate\Http\JsonResponse
    {
        return response()->json(null, 204);
    }

    protected function errorResponse(string $message = 'An error occurred', int $code = 400, mixed $errors = null): \Illuminate\Http\JsonResponse
    {
        $response = ['success' => false, 'message' => $message];
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        return response()->json($response, $code);
    }

    protected function unauthorizedResponse(string $message = 'Unauthenticated'): \Illuminate\Http\JsonResponse
    {
        return $this->errorResponse($message, 401);
    }

    protected function forbiddenResponse(string $message = 'Forbidden'): \Illuminate\Http\JsonResponse
    {
        return $this->errorResponse($message, 403);
    }

    protected function notFoundResponse(string $message = 'Not found'): \Illuminate\Http\JsonResponse
    {
        return $this->errorResponse($message, 404);
    }

    protected function validationErrorResponse(\Illuminate\Validation\ValidationException $e): \Illuminate\Http\JsonResponse
    {
        return $this->errorResponse('Validation failed', 422, $e->errors());
    }
}
