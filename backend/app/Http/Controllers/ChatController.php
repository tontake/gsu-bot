<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Models\User;
use App\Services\LlmService;
use App\Services\TranslationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    public function __construct(
        protected LlmService $llm,
        protected TranslationService $translator,
    ) {}

    /**
     * POST /api/chat/send
     */
    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:5000',
            'session_id' => 'nullable|uuid',
        ]);

        $user = $request->user();
        $originalMessage = $validated['message'];

        // Auto-detect & translate Shona/Ndebele to English
        $translationResult = $this->translator->detectAndTranslate($originalMessage);
        $wasTranslated = $translationResult['translated'];
        $originalLanguage = $translationResult['original_language'];
        $messageForLlm = $translationResult['translated_text'];

        // Find or create a chat session
        if (!empty($validated['session_id'])) {
            $session = ChatSession::where('session_id', $validated['session_id'])
                ->where('user_id', $user->id)
                ->firstOrFail();
        } else {
            $session = ChatSession::create([
                'session_id' => Str::uuid()->toString(),
                'user_id' => $user->id,
                'last_message_at' => now(),
            ]);
        }

        // Get conversation history for context
        $history = $session->messages()
            ->orderBy('created_at')
            ->limit(20)
            ->get()
            ->map(fn ($msg) => [
                'message' => $msg->message,
                'response' => $msg->response,
            ])
            ->toArray();

        // Call LLM with function calling support
        $llmResult = $this->llm->chat($messageForLlm, $history, $user->id);

        $message = ChatMessage::create([
            'chat_session_id' => $session->id,
            'user_id' => $user->id,
            'message' => $originalMessage,
            'response' => $llmResult['response'],
            'translated' => $wasTranslated,
            'original_language' => $originalLanguage,
        ]);

        $session->update(['last_message_at' => now()]);

        // If translated, log to audit
        if ($wasTranslated) {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'chat_translation',
                'description' => "Message auto-translated from {$originalLanguage} to English. Original: \"{$originalMessage}\"",
                'ip_address' => $request->ip(),
            ]);
        }

        // Log any function calls to audit
        foreach ($llmResult['functions_called'] as $fn) {
            $action = $fn['name'] === 'create_support_ticket'
                ? 'auto_ticket_created'
                : 'llm_function_call';

            AuditLog::create([
                'user_id' => $user->id,
                'action' => $action,
                'description' => "LLM called function: {$fn['name']} with args: " . json_encode($fn['arguments']),
                'ip_address' => $request->ip(),
            ]);
        }

        return response()->json([
            'session_id' => $session->session_id,
            'message' => $message->message,
            'response' => $message->response,
            'translated' => $message->translated,
            'original_language' => $message->original_language,
            'timestamp' => $message->created_at->toIso8601String(),
        ]);
    }

    /**
     * GET /api/chat/sessions
     */
    public function sessions(Request $request): JsonResponse
    {
        $sessions = ChatSession::where('user_id', $request->user()->id)
            ->withCount('messages')
            ->orderByDesc('last_message_at')
            ->get()
            ->map(fn ($session) => [
                'id' => $session->id,
                'session_id' => $session->session_id,
                'created_at' => $session->created_at->toIso8601String(),
                'last_message_at' => $session->last_message_at?->toIso8601String(),
                'message_count' => $session->messages_count,
            ]);

        return response()->json($sessions);
    }

    /**
     * GET /api/chat/sessions/{session_id}/messages
     */
    public function messages(Request $request, string $sessionId): JsonResponse
    {
        $session = ChatSession::where('session_id', $sessionId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $messages = $session->messages()
            ->orderBy('created_at')
            ->get()
            ->map(fn ($msg) => [
                'id' => $msg->id,
                'message' => $msg->message,
                'response' => $msg->response,
                'timestamp' => $msg->created_at->toIso8601String(),
            ]);

        return response()->json($messages);
    }

    /**
     * DELETE /api/chat/sessions/{session_id}
     * Delete a specific chat session and its messages.
     */
    public function deleteSession(Request $request, string $sessionId): JsonResponse
    {
        $session = ChatSession::where('session_id', $sessionId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        // Delete all messages in the session first
        $session->messages()->delete();
        $session->delete();

        return response()->json(['message' => 'Chat session deleted successfully.']);
    }

    /**
     * DELETE /api/chat/sessions
     * Delete all chat sessions for the authenticated user.
     */
    public function deleteAllSessions(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Delete all messages for user's sessions
        ChatMessage::whereIn(
            'chat_session_id',
            ChatSession::where('user_id', $userId)->pluck('id')
        )->delete();

        // Delete all sessions
        ChatSession::where('user_id', $userId)->delete();

        return response()->json(['message' => 'All chat sessions deleted successfully.']);
    }

    /**
     * POST /api/chat/reset-password
     * Password reset endpoint called by LLM function calling.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'date_of_birth' => 'required|date',
            'national_id' => 'required|string',
            'security_code' => 'required|string',
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

        // Generate a temporary password
        $tempPassword = Str::random(12);
        $user->update(['password' => $tempPassword]);

        return response()->json([
            'message' => 'Password has been reset. A temporary password has been generated.',
            'temporary_password' => $tempPassword,
        ]);
    }
}
