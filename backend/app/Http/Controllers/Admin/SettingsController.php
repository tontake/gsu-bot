<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * GET /api/admin/settings
     */
    public function index(): JsonResponse
    {
        $settings = SystemSetting::all()->pluck('value', 'key');

        $defaults = [
            'llm_model' => 'gpt-4o',
            'max_tokens' => '2048',
            'temperature' => '0.7',
            'translation_enabled' => 'true',
            'supported_languages' => '["en","sn","nd"]',
            'auto_ticket_creation' => 'true',
            'maintenance_mode' => 'false',
        ];

        $result = [];
        foreach ($defaults as $key => $default) {
            $value = $settings[$key] ?? $default;

            // Parse JSON booleans and arrays
            if (in_array($value, ['true', 'false'])) {
                $result[$key] = $value === 'true';
            } elseif (str_starts_with($value, '[') || str_starts_with($value, '{')) {
                $result[$key] = json_decode($value, true);
            } elseif (is_numeric($value) && str_contains($value, '.')) {
                $result[$key] = (float) $value;
            } elseif (is_numeric($value)) {
                $result[$key] = (int) $value;
            } else {
                $result[$key] = $value;
            }
        }

        return response()->json($result);
    }

    /**
     * PUT /api/admin/settings
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'llm_model' => 'sometimes|string',
            'max_tokens' => 'sometimes|integer|min:100|max:32000',
            'temperature' => 'sometimes|numeric|min:0|max:2',
            'translation_enabled' => 'sometimes|boolean',
            'supported_languages' => 'sometimes|array',
            'auto_ticket_creation' => 'sometimes|boolean',
            'maintenance_mode' => 'sometimes|boolean',
        ]);

        foreach ($validated as $key => $value) {
            if (is_array($value)) {
                $value = json_encode($value);
            } elseif (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            } else {
                $value = (string) $value;
            }

            SystemSetting::setValue($key, $value);
        }

        return response()->json(['message' => 'Settings updated successfully.']);
    }
}
