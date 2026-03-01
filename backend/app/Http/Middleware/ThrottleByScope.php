<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ThrottleByScope
{
    public function __construct(protected RateLimiter $limiter) {}

    public function handle(Request $request, Closure $next, string $scope = 'general'): Response
    {
        $limits = [
            'auth' => 10,
            'chat' => 30,
            'general' => 60,
            'admin' => 120,
        ];

        $maxAttempts = $limits[$scope] ?? 60;
        $key = $scope . '|' . ($request->user()?->id ?? $request->ip());

        if ($this->limiter->tooManyAttempts($key, $maxAttempts)) {
            $retryAfter = $this->limiter->availableIn($key);

            return response()->json([
                'message' => 'Too many requests. Please try again later.',
            ], 429)->withHeaders([
                'Retry-After' => $retryAfter,
                'X-RateLimit-Limit' => $maxAttempts,
                'X-RateLimit-Remaining' => 0,
            ]);
        }

        $this->limiter->hit($key, 60);

        $response = $next($request);

        return $response->withHeaders([
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => $this->limiter->remaining($key, $maxAttempts),
        ]);
    }
}
