<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\StrongPassword;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * POST /api/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->update(['last_login_at' => now()]);
        $token = $user->createToken('auth-token')->plainTextToken;

        $response = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'onboarding_completed' => $user->onboarding_completed,
                'security_code_acknowledged' => (bool) $user->security_code_acknowledged,
            ],
            'token' => "Bearer {$token}",
        ];

        // If security code not yet acknowledged, include it so the popup can show it
        if (!$user->security_code_acknowledged && $user->security_code) {
            $response['user']['security_code'] = $user->security_code;
        }

        return response()->json($response);
    }

    /**
     * GET /api/auth/google/redirect
     */
    public function googleRedirect()
    {
        /** @var \Laravel\Socialite\Two\GoogleProvider $driver */
        $driver = Socialite::driver('google');

        return $driver->stateless()->redirect();
    }

    /**
     * GET /api/auth/google/callback
     */
    public function googleCallback(): JsonResponse
    {
        /** @var \Laravel\Socialite\Two\GoogleProvider $driver */
        $driver = Socialite::driver('google');
        $googleUser = $driver->stateless()->user();

        $user = User::updateOrCreate(
            ['google_id' => $googleUser->getId()],
            [
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'email_verified_at' => now(),
            ]
        );

        $user->update(['last_login_at' => now()]);
        $token = $user->createToken('auth-token')->plainTextToken;

        $response = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'onboarding_completed' => $user->onboarding_completed,
                'security_code_acknowledged' => (bool) $user->security_code_acknowledged,
            ],
            'token' => "Bearer {$token}",
        ];

        if (!$user->security_code_acknowledged && $user->security_code) {
            $response['user']['security_code'] = $user->security_code;
        }

        return response()->json($response);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * POST /api/auth/reset-password-unauthenticated
     */
    public function resetPasswordUnauthenticated(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'date_of_birth' => 'required|date',
            'national_id' => 'required|string',
            'security_code' => 'required|string',
            'new_password' => ['required', 'string', new StrongPassword],
            'new_password_confirmation' => 'required|string|same:new_password',
        ]);

        $user = User::where('email', $validated['email'])
            ->where('national_id', $validated['national_id'])
            ->where('security_code', $validated['security_code'])
            ->whereDate('date_of_birth', $validated['date_of_birth'])
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'The provided credentials do not match our records.',
            ], 422);
        }

        $user->update(['password' => $validated['new_password']]);

        return response()->json(['message' => 'Password reset successfully.']);
    }

    /**
     * POST /api/auth/reset-password
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => ['required', 'string', new StrongPassword],
            'new_password_confirmation' => 'required|string|same:new_password',
        ]);

        if (!Hash::check($validated['current_password'], $request->user()->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $request->user()->update(['password' => $validated['new_password']]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    /**
     * POST /api/auth/set-security-code
     */
    public function setSecurityCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'security_code' => 'required|string|min:4|max:20',
        ]);

        $request->user()->update(['security_code' => $validated['security_code']]);

        return response()->json(['message' => 'Security code set successfully.']);
    }

    /**
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'onboarding_completed' => $user->onboarding_completed,
            'has_security_code' => !empty($user->security_code),
            'security_code_acknowledged' => (bool) $user->security_code_acknowledged,
            'created_at' => $user->created_at->toIso8601String(),
        ]);
    }

    /**
     * POST /api/auth/acknowledge-security-code
     */
    public function acknowledgeSecurityCode(Request $request): JsonResponse
    {
        $request->user()->update(['security_code_acknowledged' => true]);

        return response()->json(['message' => 'Security code acknowledged.']);
    }
}
