<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OnboardingController extends Controller
{
    /**
     * POST /api/onboarding/complete
     * During onboarding, user selects role, provides DOB, national ID.
     * A security code is auto-generated for password reset purposes.
     */
    public function complete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role' => 'required|in:student,staff',
            'date_of_birth' => 'required|date',
            'national_id' => 'required|string',
        ]);

        // Auto-generate a security code
        $securityCode = strtoupper(Str::random(8));

        $request->user()->update([
            'role' => $validated['role'],
            'date_of_birth' => $validated['date_of_birth'],
            'national_id' => $validated['national_id'],
            'security_code' => $securityCode,
            'onboarding_completed' => true,
        ]);

        return response()->json([
            'message' => 'Onboarding completed successfully.',
            'security_code' => $securityCode,
            'security_code_notice' => 'Please save this security code securely. You will need it to reset your password if you are not logged in.',
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $validated['role'],
                'onboarding_completed' => true,
            ],
        ]);
    }
}
