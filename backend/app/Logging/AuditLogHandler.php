<?php

namespace App\Logging;

use App\Models\AuditLog;
use Monolog\Handler\AbstractProcessingHandler;
use Monolog\LogRecord;
use Monolog\Level;
use Throwable;

class AuditLogHandler extends AbstractProcessingHandler
{
    public function __construct(Level|int|string $level = Level::Debug, bool $bubble = true)
    {
        parent::__construct($level, $bubble);
    }

    protected function write(LogRecord $record): void
    {
        try {
            // Extract user ID from context if available, or from auth
            $userId = $record->context['user_id'] ?? null;
            if ($userId === null) {
                try {
                    $userId = auth()->id();
                } catch (Throwable) {
                    $userId = null;
                }
            }

            // Extract IP address from context or request
            $ipAddress = $record->context['ip_address'] ?? null;
            if ($ipAddress === null) {
                try {
                    $ipAddress = request()->ip();
                } catch (Throwable) {
                    $ipAddress = null;
                }
            }

            // Build context data, excluding already-extracted fields
            $contextData = $record->context;
            unset($contextData['user_id'], $contextData['ip_address']);

            // If there's an exception in context, serialize it
            if (isset($contextData['exception']) && $contextData['exception'] instanceof Throwable) {
                $exception = $contextData['exception'];
                $contextData['exception'] = [
                    'class' => get_class($exception),
                    'message' => $exception->getMessage(),
                    'code' => $exception->getCode(),
                    'file' => $exception->getFile(),
                    'line' => $exception->getLine(),
                    'trace' => mb_substr($exception->getTraceAsString(), 0, 3000),
                ];
            }

            // Include extra data if present
            if (!empty($record->extra)) {
                $contextData['_extra'] = $record->extra;
            }

            AuditLog::create([
                'user_id' => $userId,
                'action' => 'log.' . $record->level->name,
                'level' => $record->level->name,
                'channel' => $record->channel,
                'description' => mb_substr($record->message, 0, 65000),
                'context' => !empty($contextData) ? json_encode($contextData, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR) : null,
                'ip_address' => $ipAddress,
            ]);
        } catch (Throwable) {
            // Silently fail to prevent infinite logging loops
            // The regular file log channel will still capture the entry
        }
    }
}
