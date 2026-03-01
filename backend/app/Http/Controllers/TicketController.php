<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\TicketReply;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    /**
     * POST /api/tickets
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
            'category' => 'sometimes|string|max:50',
        ]);

        $ticket = $request->user()->tickets()->create([
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'category' => $validated['category'] ?? 'general',
        ]);

        return response()->json([
            'id' => $ticket->id,
            'subject' => $ticket->subject,
            'message' => $ticket->message,
            'category' => $ticket->category,
            'status' => $ticket->status,
            'created_at' => $ticket->created_at->toIso8601String(),
            'updated_at' => $ticket->updated_at->toIso8601String(),
        ], 201);
    }

    /**
     * GET /api/tickets
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->tickets();

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $tickets = $query->orderByDesc('created_at')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => $tickets->map(fn ($ticket) => [
                'id' => $ticket->id,
                'subject' => $ticket->subject,
                'category' => $ticket->category,
                'status' => $ticket->status,
                'created_at' => $ticket->created_at->toIso8601String(),
                'last_reply_at' => $ticket->last_reply_at?->toIso8601String(),
            ]),
            'meta' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
        ]);
    }

    /**
     * GET /api/tickets/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $ticket = $request->user()->tickets()
            ->with(['replies.user:id,name,role'])
            ->findOrFail($id);

        return response()->json([
            'id' => $ticket->id,
            'subject' => $ticket->subject,
            'message' => $ticket->message,
            'category' => $ticket->category,
            'status' => $ticket->status,
            'created_at' => $ticket->created_at->toIso8601String(),
            'updated_at' => $ticket->updated_at->toIso8601String(),
            'replies' => $ticket->replies->map(fn ($reply) => [
                'id' => $reply->id,
                'reply' => $reply->reply,
                'message' => $reply->reply,
                'replied_by' => [
                    'id' => $reply->user->id,
                    'name' => $reply->user->name,
                    'role' => $reply->user->role,
                ],
                'user' => [
                    'id' => $reply->user->id,
                    'name' => $reply->user->name,
                    'role' => $reply->user->role,
                ],
                'created_at' => $reply->created_at->toIso8601String(),
            ]),
        ]);
    }

    /**
     * POST /api/tickets/{id}/reply
     */
    public function reply(Request $request, int $id): JsonResponse
    {
        $ticket = $request->user()->tickets()->findOrFail($id);

        $validated = $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        $reply = TicketReply::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'reply' => $validated['message'],
        ]);

        $ticket->update(['last_reply_at' => now()]);

        // Notify admins about user reply
        $admins = \App\Models\User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'ticket_user_reply',
                'title' => 'User replied to ticket',
                'message' => "{$request->user()->name} replied to ticket: \"{$ticket->subject}\"",
                'data' => [
                    'ticket_id' => $ticket->id,
                    'reply_id' => $reply->id,
                ],
            ]);
        }

        return response()->json([
            'id' => $reply->id,
            'reply' => $reply->reply,
            'message' => $reply->reply,
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'role' => $request->user()->role,
            ],
            'replied_by' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'role' => $request->user()->role,
            ],
            'created_at' => $reply->created_at->toIso8601String(),
        ]);
    }
}
