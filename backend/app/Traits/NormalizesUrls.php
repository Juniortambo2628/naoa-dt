<?php

namespace App\Traits;

trait NormalizesUrls
{
    /**
     * Normalize localhost/127.0.0.1 URLs to relative paths for frontend proxy compatibility.
     * Handles strings, arrays, and nested structures recursively.
     */
    protected function normalizeUrls(mixed $data): mixed
    {
        if (is_string($data)) {
            if (str_contains($data, 'localhost') || str_contains($data, '127.0.0.1')) {
                $parsed = parse_url($data);
                if (isset($parsed['path'])) {
                    $path = $parsed['path'];
                    $prefix = '/wed-dt/backend/public';
                    if (str_starts_with($path, $prefix)) {
                        $path = substr($path, strlen($prefix));
                    }
                    return $path;
                }
            }
            return $data;
        }

        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = $this->normalizeUrls($value);
            }
        }

        return $data;
    }
}
