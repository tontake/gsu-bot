<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeBase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KnowledgeBaseController extends Controller
{
    /**
     * GET /api/admin/knowledge-base
     */
    public function index(Request $request): JsonResponse
    {
        $query = KnowledgeBase::orderByDesc('updated_at');

        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        $entries = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => $entries->items(),
            'meta' => [
                'current_page' => $entries->currentPage(),
                'last_page' => $entries->lastPage(),
                'per_page' => $entries->perPage(),
                'total' => $entries->total(),
            ],
        ]);
    }

    /**
     * POST /api/admin/knowledge-base
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:api,website,text',
            'description' => 'required|string',
            'content' => 'required|string',
            'is_active' => 'sometimes|boolean',
        ]);

        // Validate URL for api and website types
        if (in_array($validated['type'], ['api', 'website'])) {
            $request->validate([
                'content' => 'url',
            ]);
        }

        $entry = KnowledgeBase::create($validated);

        return response()->json($entry, 201);
    }

    /**
     * PUT /api/admin/knowledge-base/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $entry = KnowledgeBase::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:api,website,text',
            'description' => 'sometimes|string',
            'content' => 'sometimes|string',
            'is_active' => 'sometimes|boolean',
        ]);

        // Validate URL for api and website types
        $type = $validated['type'] ?? $entry->type;
        if (in_array($type, ['api', 'website']) && isset($validated['content'])) {
            $request->validate([
                'content' => 'url',
            ]);
        }

        $entry->update($validated);

        return response()->json($entry);
    }

    /**
     * DELETE /api/admin/knowledge-base/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        KnowledgeBase::findOrFail($id)->delete();

        return response()->json(null, 204);
    }
}
