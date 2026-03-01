<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeSource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KnowledgeSourceController extends Controller
{
    /**
     * GET /api/admin/knowledge-sources
     */
    public function index(Request $request): JsonResponse
    {
        $sources = KnowledgeSource::orderByDesc('updated_at')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => $sources->items(),
            'meta' => [
                'current_page' => $sources->currentPage(),
                'last_page' => $sources->lastPage(),
                'per_page' => $sources->perPage(),
                'total' => $sources->total(),
            ],
        ]);
    }

    /**
     * POST /api/admin/knowledge-sources
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'sometimes|string',
            'type' => 'required|in:database,api,website',
            'config' => 'required|array',
            'category' => 'sometimes|string|max:100',
            'is_active' => 'sometimes|boolean',
            'table_descriptions' => 'sometimes|array',
        ]);

        $source = KnowledgeSource::create($validated);

        return response()->json($source, 201);
    }

    /**
     * PUT /api/admin/knowledge-sources/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $source = KnowledgeSource::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'type' => 'sometimes|in:database,api,website',
            'config' => 'sometimes|array',
            'category' => 'sometimes|string|max:100',
            'is_active' => 'sometimes|boolean',
            'table_descriptions' => 'sometimes|array',
            'crawled_schema' => 'sometimes|array',
        ]);

        $source->update($validated);

        return response()->json($source);
    }

    /**
     * DELETE /api/admin/knowledge-sources/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        KnowledgeSource::findOrFail($id)->delete();

        return response()->json(null, 204);
    }
}
