<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FaqAnalytic;
use Illuminate\Http\JsonResponse;

class FaqAnalyticsController extends Controller
{
    /**
     * GET /api/admin/faq-analytics
     */
    public function index(): JsonResponse
    {
        $analytics = FaqAnalytic::orderByDesc('frequency')->get();

        return response()->json($analytics->map(fn ($faq) => [
            'id' => $faq->id,
            'question' => $faq->question,
            'frequency' => $faq->frequency,
            'has_kb_match' => $faq->has_kb_match,
            'satisfaction_rate' => (float) $faq->satisfaction_rate,
        ]));
    }

    /**
     * POST /api/admin/faq-analytics/{id}/enhance
     */
    public function enhance(int $id): JsonResponse
    {
        $faq = FaqAnalytic::findOrFail($id);

        // TODO: Integrate with LLM to enhance training data based on FAQ
        // This is a placeholder for the actual LLM enhancement logic

        return response()->json([
            'message' => 'FAQ data has been submitted for LLM training enhancement.',
            'faq_id' => $faq->id,
            'question' => $faq->question,
        ]);
    }
}
