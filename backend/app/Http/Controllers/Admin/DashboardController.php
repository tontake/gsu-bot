<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatSession;
use App\Models\KnowledgeBase;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * GET /api/admin/dashboard/stats
     */
    public function stats(): JsonResponse
    {
        $totalUsers = User::count();
        $totalSessions = ChatSession::count();
        $totalTickets = Ticket::count();
        $openTickets = Ticket::where('status', 'open')->count();
        $knowledgeBaseCount = KnowledgeBase::count();

        // Popular categories from chat messages or knowledge base
        $popularCategories = KnowledgeBase::select('category', DB::raw('COUNT(*) as count'))
            ->groupBy('category')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'name' => $item->category,
                'count' => $item->count,
            ]);

        return response()->json([
            'total_users' => $totalUsers,
            'total_sessions' => $totalSessions,
            'total_tickets' => $totalTickets,
            'open_tickets' => $openTickets,
            'knowledge_base_count' => $knowledgeBaseCount,
            'popular_categories' => $popularCategories,
            'avg_response_time_ms' => 0, // TODO: Implement actual tracking
            'satisfaction_rate' => 0.0,   // TODO: Implement actual tracking
        ]);
    }
}
