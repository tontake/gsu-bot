<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Rules\StrongPassword;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserController extends Controller
{
    /**
     * POST /api/admin/users
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', 'string', new StrongPassword],
            'role' => 'required|in:admin,student,staff',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'],
            'security_code' => strtoupper(Str::random(8)),
            'security_code_acknowledged' => false,
            'onboarding_completed' => true,
            'preferred_language' => 'en',
        ]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'admin_create_user',
            'details' => "Created user {$user->email} with role {$user->role}",
        ]);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'created_at' => $user->created_at->toIso8601String(),
        ], 201);
    }

    /**
     * POST /api/admin/users/import-csv
     */
    public function importCsv(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');

        // Read header row
        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return response()->json(['message' => 'CSV file is empty or invalid.'], 422);
        }

        $header = array_map(fn ($h) => strtolower(trim($h)), $header);
        $requiredColumns = ['name', 'email', 'password', 'role'];
        $missing = array_diff($requiredColumns, $header);

        if (!empty($missing)) {
            fclose($handle);
            return response()->json([
                'message' => 'CSV is missing required columns: ' . implode(', ', $missing),
            ], 422);
        }

        $created = [];
        $errors = [];
        $row = 1;

        while (($data = fgetcsv($handle)) !== false) {
            $row++;
            if (count($data) !== count($header)) {
                $errors[] = "Row {$row}: Column count mismatch.";
                continue;
            }

            $record = array_combine($header, $data);

            $validator = Validator::make($record, [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => ['required', 'string', new StrongPassword],
                'role' => 'required|in:admin,student,staff',
            ]);

            if ($validator->fails()) {
                $msgs = collect($validator->errors()->all())->join('; ');
                $errors[] = "Row {$row} ({$record['email']}): {$msgs}";
                continue;
            }

            $user = User::create([
                'name' => trim($record['name']),
                'email' => trim($record['email']),
                'password' => $record['password'],
                'role' => trim($record['role']),
                'security_code' => strtoupper(Str::random(8)),
                'security_code_acknowledged' => false,
                'onboarding_completed' => true,
                'preferred_language' => 'en',
            ]);

            $created[] = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ];
        }

        fclose($handle);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'admin_import_csv',
            'details' => 'Imported ' . count($created) . ' users via CSV. ' . count($errors) . ' errors.',
        ]);

        return response()->json([
            'created_count' => count($created),
            'error_count' => count($errors),
            'created' => $created,
            'errors' => $errors,
        ], count($created) > 0 ? 201 : 422);
    }

    /**
     * GET /api/admin/users
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderByDesc('created_at')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => $users->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at->toIso8601String(),
                'last_login_at' => $user->last_login_at?->toIso8601String(),
            ]),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * PUT /api/admin/users/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'role' => 'sometimes|in:student,staff,admin',
        ]);

        $user->update($validated);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'updated_at' => $user->updated_at->toIso8601String(),
        ]);
    }

    /**
     * DELETE /api/admin/users/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(null, 204);
    }

    /**
     * POST /api/admin/users/{id}/generate-security-code
     */
    public function generateSecurityCode(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $newCode = strtoupper(Str::random(8));
        $user->update([
            'security_code' => $newCode,
            'security_code_acknowledged' => false,
        ]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'admin_generate_security_code',
            'details' => "Generated new security code for user {$user->email}",
        ]);

        return response()->json([
            'security_code' => $newCode,
            'message' => 'New security code generated. User will be prompted to save it on next login.',
        ]);
    }
}
