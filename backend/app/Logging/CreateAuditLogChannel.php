<?php

namespace App\Logging;

use Monolog\Logger;

class CreateAuditLogChannel
{
    /**
     * Create a custom Monolog instance for the audit log channel.
     */
    public function __invoke(array $config): Logger
    {
        $logger = new Logger('audit');
        $logger->pushHandler(new AuditLogHandler(
            level: $config['level'] ?? 'debug',
        ));

        return $logger;
    }
}
