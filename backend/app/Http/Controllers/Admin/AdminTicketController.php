<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Ticket;
use App\Models\TicketReply;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminTicketController extends Controller
{
    /**
     * GET /api/admin/tickets
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ticket::with('user:id,name,email');

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
                'user' => $ticket->user ? [
                    'id' => $ticket->user->id,
                    'name' => $ticket->user->name,
                    'email' => $ticket->user->email,
                ] : null,
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
     * GET /api/admin/tickets/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $ticket = Ticket::with(['user:id,name,email', 'replies.user:id,name,role'])
            ->findOrFail($id);

        return response()->json([
            'id' => $ticket->id,
            'subject' => $ticket->subject,
            'message' => $ticket->message,
            'category' => $ticket->category,
            'status' => $ticket->status,
            'user' => $ticket->user ? [
                'id' => $ticket->user->id,
                'name' => $ticket->user->name,
                'email' => $ticket->user->email,
            ] : null,
            'created_at' => $ticket->created_at->toIso8601String(),
            'last_reply_at' => $ticket->last_reply_at?->toIso8601String(),
            'replies' => $ticket->replies->map(fn ($reply) => [
                'id' => $reply->id,
                'message' => $reply->reply,
                'reply' => $reply->reply,
                'user' => $reply->user ? [
                    'id' => $reply->user->id,
                    'name' => $reply->user->name,
                    'role' => $reply->user->role,
                ] : null,
                'replied_by' => $reply->user ? [
                    'id' => $reply->user->id,
                    'name' => $reply->user->name,
                    'role' => $reply->user->role,
                ] : null,
                'created_at' => $reply->created_at->toIso8601String(),
            ]),
        ]);
    }

    /**
     * PUT /api/admin/tickets/{id}/reply
     */
    public function reply(Request $request, int $id): JsonResponse
    {
        $ticket = Ticket::findOrFail($id);

        $validated = $request->validate([
            'reply' => 'sometimes|string|max:5000',
            'message' => 'sometimes|string|max:5000',
        ]);

        $replyText = $validated['reply'] ?? $validated['message'] ?? '';
        if (!$replyText) {
            return response()->json(['message' => 'Reply text is required.'], 422);
        }

        $reply = TicketReply::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'reply' => $replyText,
        ]);

        $ticket->update([
            'last_reply_at' => now(),
            'status' => 'in_progress',
        ]);

        // Notify the ticket owner
        Notification::create([
            'user_id' => $ticket->user_id,
            'type' => 'ticket_reply',
            'title' => 'New reply on your ticket',
            'message' => "Admin replied to your ticket: \"{$ticket->subject}\"",
            'data' => [
                'ticket_id' => $ticket->id,
                'reply_id' => $reply->id,
                'reply_preview' => mb_substr($replyText, 0, 100),
            ],
        ]);

        return response()->json([
            'id' => $reply->id,
            'reply' => $reply->reply,
            'message' => $reply->reply,
            'replied_by' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'role' => $request->user()->role,
            ],
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'role' => $request->user()->role,
            ],
            'created_at' => $reply->created_at->toIso8601String(),
        ]);
    }

    /**
     * PUT /api/admin/tickets/{id}/status
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $ticket = Ticket::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
        ]);

        $oldStatus = $ticket->status;
        $ticket->update(['status' => $validated['status']]);

        // Notify the user when ticket is resolved or closed
        if (in_array($validated['status'], ['resolved', 'closed']) && $oldStatus !== $validated['status']) {
            Notification::create([
                'user_id' => $ticket->user_id,
                'type' => 'ticket_' . $validated['status'],
                'title' => 'Ticket ' . ucfirst($validated['status']),
                'message' => "Your ticket \"{$ticket->subject}\" has been marked as {$validated['status']}.",
                'data' => [
                    'ticket_id' => $ticket->id,
                ],
            ]);
        }

        return response()->json([
            'id' => $ticket->id,
            'status' => $ticket->status,
            'message' => 'Ticket status updated successfully.',
        ]);
    }
}
