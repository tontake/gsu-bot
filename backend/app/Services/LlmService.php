<?php

namespace App\Services;

use App\Models\KnowledgeBase;
use App\Models\KnowledgeSource;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class LlmService
{
    protected string $apiKey;
    protected string $model;
    protected ?int $currentUserId = null;

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key', '');
        $this->model = config('services.openai.model', 'gpt-4o');
    }

    /**
     * Load knowledge base content (api, website, text types) to inject into the system prompt.
     */
    protected function getKnowledgeBaseContent(): string
    {
        $entries = KnowledgeBase::where('is_active', true)->get();

        if ($entries->isEmpty()) {
            return "(No knowledge base entries have been configured yet.)";
        }

        $content = "";
        foreach ($entries as $entry) {
            $typeLabel = strtoupper($entry->type);
            $content .= "### [{$typeLabel}] {$entry->name}\n";
            $content .= "**Description:** {$entry->description}\n";

            if ($entry->type === 'text') {
                $content .= "**Content:**\n{$entry->content}\n\n";
            } elseif ($entry->type === 'api') {
                $content .= "**API Endpoint:** {$entry->content}\n";
                $content .= "(This is an API endpoint the university provides. Use the information in the description to understand what it returns.)\n\n";
            } elseif ($entry->type === 'website') {
                $content .= "**Website:** {$entry->content}\n";
                $content .= "(This is a university website link. Use the description to understand what information is available there.)\n\n";
            }
        }

        return $content;
    }

    /**
     * Get available function definitions from active knowledge sources + built-in functions.
     */
    protected function getFunctionDefinitions(): array
    {
        $functions = [];

        // Built-in: Password Reset
        $functions[] = [
            'type' => 'function',
            'function' => [
                'name' => 'reset_user_password',
                'description' => 'Reset a user password when they provide their email, date of birth, national ID, and security code.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'email' => ['type' => 'string', 'description' => 'User email address'],
                        'date_of_birth' => ['type' => 'string', 'description' => 'Date of birth in YYYY-MM-DD format'],
                        'national_id' => ['type' => 'string', 'description' => 'National ID number'],
                        'security_code' => ['type' => 'string', 'description' => 'Security code set during onboarding'],
                    ],
                    'required' => ['email', 'date_of_birth', 'national_id', 'security_code'],
                ],
            ],
        ];

        // Built-in: Create Support Ticket (when the bot cannot answer)
        $functions[] = [
            'type' => 'function',
            'function' => [
                'name' => 'create_support_ticket',
                'description' => 'Create a support ticket when you cannot answer the user\'s question from the available knowledge base or data sources. Use this as a last resort after attempting to answer using available tools.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'subject' => ['type' => 'string', 'description' => 'A brief summary of the user\'s question or issue'],
                        'message' => ['type' => 'string', 'description' => 'Full description of what the user needs help with, including context from the conversation'],
                        'category' => [
                            'type' => 'string',
                            'enum' => ['general', 'academic', 'financial', 'technical', 'other'],
                            'description' => 'The category that best fits the enquiry',
                        ],
                    ],
                    'required' => ['subject', 'message', 'category'],
                ],
            ],
        ];

        // Dynamic functions from active knowledge sources
        $sources = KnowledgeSource::where('is_active', true)->get();

        foreach ($sources as $source) {
            $funcName = 'query_' . Str::snake($source->name);

            // Build a rich description including user-provided table descriptions and crawled schema
            $description = $source->description ?: "Query {$source->name} ({$source->type}) for {$source->category} information.";

            if ($source->type === 'database') {
                // Append table descriptions so LLM understands the database
                $tableInfo = '';
                if (!empty($source->table_descriptions)) {
                    $tableInfo .= "\n\nAvailable tables:\n";
                    foreach ($source->table_descriptions as $td) {
                        $tableName = $td['table'] ?? 'unknown';
                        $tableDesc = $td['description'] ?? '';
                        $tableInfo .= "- {$tableName}: {$tableDesc}\n";
                    }
                }

                // Append crawled schema summary so LLM knows column names AND sample data
                // ONLY include tables listed in table_descriptions to avoid token overflow
                if (!empty($source->crawled_schema)) {
                    $relevantTables = collect($source->table_descriptions ?? [])
                        ->pluck('table')
                        ->filter()
                        ->toArray();

                    $tableInfo .= "\nDatabase schema (crawled):\n";
                    foreach ($source->crawled_schema as $tableName => $info) {
                        // Only show tables that the admin explicitly listed, or all if none listed
                        if (!empty($relevantTables) && !in_array($tableName, $relevantTables)) {
                            continue;
                        }

                        // Show column names only (not types) to save tokens
                        $colNames = collect($info['columns'] ?? [])->pluck('name')->implode(', ');
                        $rowCount = $info['row_count'] ?? 0;
                        $tableInfo .= "- {$tableName} ({$rowCount} rows): [{$colNames}]\n";

                        // Include sample data with only key identifying columns to save tokens
                        if (!empty($info['sample_data'])) {
                            $tableInfo .= "  Sample rows (key fields):\n";
                            // Pick only useful identifying columns (limit to 6 columns per row)
                            $allCols = array_keys((array) $info['sample_data'][0]);
                            $priorityCols = array_filter($allCols, function ($col) {
                                $col = strtolower($col);
                                return str_contains($col, 'name') || str_contains($col, 'id')
                                    || str_contains($col, 'number') || str_contains($col, 'email')
                                    || str_contains($col, 'status') || str_contains($col, 'programme')
                                    || str_contains($col, 'year') || str_contains($col, 'campus')
                                    || $col === 'sex' || $col === 'title';
                            });
                            $displayCols = array_slice($priorityCols ?: array_slice($allCols, 0, 6), 0, 8);

                            foreach (array_slice($info['sample_data'], 0, 3) as $row) {
                                $rowArr = (array) $row;
                                $rowStr = collect($displayCols)
                                    ->filter(fn($c) => isset($rowArr[$c]) && $rowArr[$c] !== null && $rowArr[$c] !== '')
                                    ->map(fn($c) => "{$c}=" . Str::limit((string)$rowArr[$c], 30))
                                    ->implode(', ');
                                $tableInfo .= "    {$rowStr}\n";
                            }
                        }
                    }
                }

                $fullDescription = $description . $tableInfo
                    . "\n\nQUERY STRATEGY — ALWAYS use 'sql_query' to write a targeted SELECT query based on the schema above. "
                    . "For example: SELECT * FROM studentmember WHERE lastName LIKE '%Smith%' OR firstName LIKE '%Smith%' LIMIT 10. "
                    . "For counts: SELECT COUNT(*) as total FROM studentmember WHERE status='ENROLLED'. "
                    . "Only SELECT statements are allowed. Always include LIMIT. "
                    . "Only use 'table' + 'query_param' as a fallback for very simple lookups.";

                // Truncate if description is too long (OpenAI has limits on tool descriptions)
                if (strlen($fullDescription) > 4000) {
                    $fullDescription = substr($fullDescription, 0, 3900) . "\n...(schema truncated for brevity)";
                }

                $functions[] = [
                    'type' => 'function',
                    'function' => [
                        'name' => $funcName,
                        'description' => $fullDescription,
                        'parameters' => [
                            'type' => 'object',
                            'properties' => [
                                'table' => [
                                    'type' => 'string',
                                    'description' => "The table name to query in the {$source->name} database",
                                ],
                                'query_param' => [
                                    'type' => 'string',
                                    'description' => "The search value (e.g., student name, student ID, staff name) for querying. Used for simple single-table searches.",
                                ],
                                'search_column' => [
                                    'type' => 'string',
                                    'description' => "The column to search in (e.g., id, name, email). If omitted, all text/string columns are searched automatically.",
                                ],
                                'sql_query' => [
                                    'type' => 'string',
                                    'description' => "A read-only SELECT SQL query for complex lookups (e.g., JOINs, multiple conditions). Only SELECT statements are allowed. Use this when you need to search across multiple columns or tables.",
                                ],
                            ],
                            'required' => [],
                        ],
                    ],
                ];
            } elseif ($source->type === 'api') {
                $functions[] = [
                    'type' => 'function',
                    'function' => [
                        'name' => $funcName,
                        'description' => $description,
                        'parameters' => [
                            'type' => 'object',
                            'properties' => [
                                'query_param' => [
                                    'type' => 'string',
                                    'description' => "The query parameter for the {$source->name} API",
                                ],
                            ],
                            'required' => ['query_param'],
                        ],
                    ],
                ];
            }
        }

        return $functions;
    }

    /**
     * Execute a function call from the LLM.
     */
    protected function executeFunctionCall(string $name, array $arguments): string
    {
        // Built-in: password reset
        if ($name === 'reset_user_password') {
            return $this->executePasswordReset($arguments);
        }

        // Built-in: create support ticket
        if ($name === 'create_support_ticket') {
            return $this->executeCreateTicket($arguments);
        }

        // Dynamic source queries
        if (str_starts_with($name, 'query_')) {
            $sourceName = str_replace('query_', '', $name);
            $source = KnowledgeSource::where('is_active', true)->get()->first(function ($s) use ($sourceName) {
                return Str::snake($s->name) === $sourceName;
            });

            if ($source) {
                return $this->executeSourceQuery($source, $arguments);
            }
        }

        return json_encode(['error' => 'Unknown function']);
    }

    /**
     * Execute a password reset via function calling.
     */
    protected function executePasswordReset(array $args): string
    {
        $user = User::where('email', $args['email'] ?? '')
            ->where('national_id', $args['national_id'] ?? '')
            ->where('security_code', $args['security_code'] ?? '')
            ->whereDate('date_of_birth', $args['date_of_birth'] ?? '')
            ->first();

        if (!$user) {
            return json_encode(['success' => false, 'message' => 'Credentials do not match. Please verify your email, date of birth, national ID, and security code.']);
        }

        $tempPassword = Str::random(12);
        $user->update(['password' => $tempPassword]);

        return json_encode([
            'success' => true,
            'message' => "Password has been reset successfully. Your temporary password is: {$tempPassword}. Please change it after logging in.",
        ]);
    }

    /**
     * Create a support ticket on behalf of the user when the bot cannot answer.
     */
    protected function executeCreateTicket(array $args): string
    {
        $userId = $this->currentUserId;

        if (!$userId) {
            return json_encode(['success' => false, 'message' => 'Cannot create ticket without an authenticated user.']);
        }

        try {
            $ticket = Ticket::create([
                'user_id'  => $userId,
                'subject'  => $args['subject'] ?? 'Auto-generated enquiry',
                'message'  => $args['message'] ?? '',
                'category' => $args['category'] ?? 'general',
                'status'   => 'open',
            ]);

            return json_encode([
                'success'   => true,
                'ticket_id' => $ticket->id,
                'message'   => "Support ticket #{$ticket->id} has been created. A staff member will follow up shortly.",
            ]);
        } catch (\Exception $e) {
            Log::error('Auto-ticket creation failed: ' . $e->getMessage());
            return json_encode(['success' => false, 'message' => 'Failed to create the ticket. Please try the Tickets page instead.']);
        }
    }

    /**
     * Set up a dynamic database connection for a knowledge source.
     */
    protected function setupDynamicConnection(KnowledgeSource $source): string
    {
        $config = $source->config;
        $connectionName = 'dynamic_llm_' . $source->id;

        \Illuminate\Support\Facades\Config::set("database.connections.{$connectionName}", [
            'driver'    => 'mysql',
            'host'      => $config['host'] ?? '127.0.0.1',
            'port'      => $config['port'] ?? '3306',
            'database'  => $config['database'] ?? '',
            'username'  => $config['username'] ?? 'root',
            'password'  => $config['password'] ?? '',
            'charset'   => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix'    => '',
            'strict'    => true,
        ]);
        DB::purge($connectionName);

        return $connectionName;
    }

    /**
     * Get all searchable (text/string) columns for a table from crawled schema.
     */
    protected function getSearchableColumns(KnowledgeSource $source, string $table): array
    {
        $schema = $source->crawled_schema ?? [];
        if (empty($schema[$table]['columns'])) {
            return [];
        }

        $textTypes = ['varchar', 'char', 'text', 'tinytext', 'mediumtext', 'longtext', 'enum'];

        return collect($schema[$table]['columns'])
            ->filter(function ($col) use ($textTypes) {
                $type = strtolower($col['type'] ?? '');
                foreach ($textTypes as $textType) {
                    if (str_contains($type, $textType)) {
                        return true;
                    }
                }
                return false;
            })
            ->pluck('name')
            ->toArray();
    }

    /**
     * Validate that a SQL query is read-only (SELECT only).
     */
    protected function isReadOnlyQuery(string $sql): bool
    {
        $normalized = trim(preg_replace('/\s+/', ' ', strtolower($sql)));

        // Must start with SELECT
        if (!str_starts_with($normalized, 'select')) {
            return false;
        }

        // Block dangerous keywords
        $blocked = ['insert', 'update', 'delete', 'drop', 'alter', 'create', 'truncate', 'replace', 'grant', 'revoke', 'exec', 'execute', 'call', 'load', 'into outfile', 'into dumpfile'];
        foreach ($blocked as $keyword) {
            if (preg_match('/\b' . preg_quote($keyword, '/') . '\b/', $normalized)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Execute a knowledge source query (database or API).
     */
    protected function executeSourceQuery(KnowledgeSource $source, array $arguments): string
    {
        $config = $source->config;
        $param = $arguments['query_param'] ?? '';

        try {
            if ($source->type === 'database') {
                $connectionName = $this->setupDynamicConnection($source);

                // --- Option A: LLM provided a SQL query for complex lookups ---
                if (!empty($arguments['sql_query'])) {
                    $sqlQuery = $arguments['sql_query'];

                    if (!$this->isReadOnlyQuery($sqlQuery)) {
                        return json_encode(['error' => 'Only read-only SELECT queries are allowed.']);
                    }

                    // Add LIMIT if not present
                    if (!preg_match('/\blimit\b/i', $sqlQuery)) {
                        $sqlQuery = rtrim($sqlQuery, '; ') . ' LIMIT 25';
                    }

                    $results = DB::connection($connectionName)->select($sqlQuery);

                    return json_encode([
                        'success' => true,
                        'data' => $results,
                        'count' => count($results),
                        'query_used' => $sqlQuery,
                    ]);
                }

                // --- Option B: Simple table + query_param search ---
                $table = $arguments['table'] ?? null;
                $searchColumn = $arguments['search_column'] ?? null;

                if (!$table) {
                    // Try to pick the first table from table_descriptions
                    if (!empty($source->table_descriptions)) {
                        $table = $source->table_descriptions[0]['table'] ?? null;
                    }
                    if (!$table) {
                        return json_encode(['error' => 'No table specified for the query.']);
                    }
                }

                $query = DB::connection($connectionName)->table($table);

                if ($param) {
                    if ($searchColumn) {
                        // Search specific column
                        $query->where($searchColumn, 'LIKE', "%{$param}%");
                    } else {
                        // Auto-search ALL text/string columns for the query param
                        $searchableColumns = $this->getSearchableColumns($source, $table);

                        if (!empty($searchableColumns)) {
                            $query->where(function ($q) use ($searchableColumns, $param) {
                                foreach ($searchableColumns as $col) {
                                    $q->orWhere($col, 'LIKE', "%{$param}%");
                                }
                            });
                        } else {
                            // Fallback: try to get columns dynamically and search all of them
                            try {
                                $rawColumns = DB::connection($connectionName)
                                    ->select("SHOW COLUMNS FROM `{$table}`");
                                $textCols = collect($rawColumns)->filter(function ($col) {
                                    $type = strtolower($col->Type);
                                    return str_contains($type, 'char') || str_contains($type, 'text') || str_contains($type, 'enum');
                                })->pluck('Field')->toArray();

                                if (!empty($textCols)) {
                                    $query->where(function ($q) use ($textCols, $param) {
                                        foreach ($textCols as $col) {
                                            $q->orWhere($col, 'LIKE', "%{$param}%");
                                        }
                                    });
                                }
                            } catch (\Exception $e) {
                                // If we can't determine columns, search without filter
                                Log::warning("Could not determine searchable columns for {$table}: " . $e->getMessage());
                            }
                        }
                    }
                }

                $results = $query->limit(25)->get();

                return json_encode(['success' => true, 'data' => $results, 'count' => count($results)]);

            } elseif ($source->type === 'api') {
                $endpoint = $config['endpoint'] ?? '';
                $method = strtolower($config['method'] ?? 'GET');
                $headers = $config['headers'] ?? [];

                $url = str_contains($endpoint, ':param')
                    ? str_replace(':param', urlencode($param), $endpoint)
                    : $endpoint . '?q=' . urlencode($param);

                $response = match ($method) {
                    'post' => Http::withHeaders($headers)->post($url, ['query' => $param]),
                    default => Http::withHeaders($headers)->get($url),
                };

                return json_encode(['success' => true, 'data' => $response->json()]);
            }
        } catch (\Exception $e) {
            Log::error("Source query failed [{$source->name}]: " . $e->getMessage());
            return json_encode(['success' => false, 'message' => 'Unable to query the data source at this time.']);
        }

        return json_encode(['error' => 'Unsupported source type']);
    }

    /**
     * Send a chat message through OpenAI with function calling support.
     *
     * @return array{response: string, functions_called: array}
     */
    public function chat(string $message, array $conversationHistory = [], ?int $userId = null): array
    {
        if (!$this->apiKey) {
            return [
                'response' => 'The AI service is not configured. Please set the OPENAI_API_KEY in the environment.',
                'functions_called' => [],
            ];
        }

        // Store user ID so built-in functions (e.g. create_support_ticket) can access it
        $this->currentUserId = $userId;

        // Load knowledge base content to inject into system prompt
        $kbContent = $this->getKnowledgeBaseContent();

        $today = now()->format('F j, Y');

        $systemPrompt = "You are GSU SmartAssist, an AI assistant for Gwanda State University. "
            . "Today's date is {$today}. All dates the user provides are valid and current — do NOT reject or question any date. "
            . "Follow these rules strictly in order of priority:\n\n"
            . "## RULE 1 — LANGUAGE POLICY (HIGHEST PRIORITY)\n"
            . "Before doing ANYTHING else, check if the user's message contains vulgar, offensive, abusive, "
            . "profane, hateful, or inappropriate language. If it does, do NOT answer the question. Instead, "
            . "respond ONLY with a polite but firm message such as:\n"
            . "\"I appreciate your message, but I noticed some inappropriate language. "
            . "Please rephrase your question in a polite and professional manner so I can assist you.\"\n"
            . "Do not process the query further. Do not call any functions.\n\n"
            . "## RULE 2 — QUERY DATA SOURCES FIRST (HIGHEST DATA PRIORITY)\n"
            . "If the message is polite and professional, ALWAYS check the available data source functions FIRST "
            . "before looking at the knowledge base. Use the function calling tools to query university databases "
            . "for live, up-to-date information.\n"
            . "- When a user asks about students, staff, enrollment counts, records, grades, courses, or ANY factual data, "
            . "you MUST call the relevant data source query function to get the real data.\n"
            . "- When asked 'how many students' or similar counts, query the database and use COUNT from the actual results.\n"
            . "- When asked about a specific person, search by name, ID, or any identifier using query_param.\n"
            . "- Do NOT answer from memory or static text when a database query can provide the answer.\n"
            . "- When searching for a person by name, use the query_param with their name — all text columns are searched automatically.\n\n"
            . "## RULE 3 — FALL BACK TO KNOWLEDGE BASE\n"
            . "Only if the data sources do not have the answer (e.g., general university policies, contact info, "
            . "procedural questions, website links), use the knowledge base information provided below. "
            . "This is curated information from the university administration:\n\n"
            . $kbContent . "\n\n"
            . "## RULE 4 — CREATE A SUPPORT TICKET (LAST RESORT)\n"
            . "If you still cannot answer the question after checking data sources AND the knowledge base, "
            . "call the create_support_ticket function to automatically raise a support ticket "
            . "for the user. Tell the user that a ticket has been created and a staff member will follow up. "
            . "Choose an appropriate category (general, academic, financial, technical, other).\n\n"
            . "## ADDITIONAL INSTRUCTIONS\n"
            . "- Be helpful, concise, and professional at all times.\n"
            . "- **ALWAYS cite your source** in your response. Examples:\n"
            . "  - If data came from a database query, say: \"According to the [source name] database, ...\"\n"
            . "  - If data came from the knowledge base, say: \"According to university records, ...\" or reference the specific KB entry name.\n"
            . "  - If data came from an API, say: \"According to the [API/source name], ...\"\n"
            . "- When a user asks to reset their password, use the reset_user_password function.\n"
            . "- You may receive messages in Shona or Ndebele (already translated to English). Respond in English.\n"
            . "- Never fabricate information. If unsure, create a ticket rather than guessing.";

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        foreach ($conversationHistory as $msg) {
            $messages[] = ['role' => 'user', 'content' => $msg['message']];
            if (!empty($msg['response'])) {
                $messages[] = ['role' => 'assistant', 'content' => $msg['response']];
            }
        }

        $messages[] = ['role' => 'user', 'content' => $message];

        $tools = $this->getFunctionDefinitions();
        $functionsCalled = [];

        // Loop to handle function calls (max 5 iterations)
        for ($i = 0; $i < 5; $i++) {
            try {
                $payload = [
                    'model' => $this->model,
                    'messages' => $messages,
                    'temperature' => 0.7,
                    'max_tokens' => 4096,
                ];

                if (!empty($tools)) {
                    $payload['tools'] = $tools;
                    $payload['tool_choice'] = 'auto';
                }

                $response = Http::withHeaders([
                    'Authorization' => "Bearer {$this->apiKey}",
                    'Content-Type' => 'application/json',
                ])->timeout(120)->post('https://api.openai.com/v1/chat/completions', $payload);

                // Log API errors
                if ($response->failed()) {
                    Log::error('OpenAI API error: ' . $response->status() . ' - ' . $response->body());
                    return [
                        'response' => 'I apologize, but the AI service returned an error. Please try again.',
                        'functions_called' => $functionsCalled,
                    ];
                }

                $responseData = $response->json();

                // Check for API-level error
                if (!empty($responseData['error'])) {
                    Log::error('OpenAI API error response: ' . json_encode($responseData['error']));
                    return [
                        'response' => 'I apologize, but the AI service encountered an issue: ' . ($responseData['error']['message'] ?? 'Unknown error'),
                        'functions_called' => $functionsCalled,
                    ];
                }

                $choice = $responseData['choices'][0] ?? null;
                if (!$choice) {
                    Log::error('OpenAI API returned no choices. Full response: ' . $response->body());
                    return [
                        'response' => 'I apologize, I was unable to generate a response. Please try again.',
                        'functions_called' => $functionsCalled,
                    ];
                }

                $assistantMessage = $choice['message'] ?? [];
                $finishReason = $choice['finish_reason'] ?? 'stop';

                // If the model wants to call tool(s)
                if ($finishReason === 'tool_calls' || !empty($assistantMessage['tool_calls'])) {
                    $messages[] = $assistantMessage;

                    foreach ($assistantMessage['tool_calls'] as $toolCall) {
                        $fnName = $toolCall['function']['name'];
                        $fnArgs = json_decode($toolCall['function']['arguments'], true) ?? [];

                        $result = $this->executeFunctionCall($fnName, $fnArgs);
                        $functionsCalled[] = ['name' => $fnName, 'arguments' => $fnArgs];

                        $messages[] = [
                            'role' => 'tool',
                            'tool_call_id' => $toolCall['id'],
                            'content' => $result,
                        ];
                    }

                    continue; // Go around the loop to get the final response
                }

                // Normal text response
                return [
                    'response' => $assistantMessage['content'] ?? 'I apologize, I was unable to generate a response.',
                    'functions_called' => $functionsCalled,
                ];

            } catch (\Exception $e) {
                Log::error('LLM chat failed: ' . $e->getMessage());
                return [
                    'response' => 'I apologize, but I encountered an error processing your request. Please try again.',
                    'functions_called' => $functionsCalled,
                ];
            }
        }

        return [
            'response' => 'I apologize, but your request required too many processing steps. Please try simplifying your question.',
            'functions_called' => $functionsCalled,
        ];
    }
}
