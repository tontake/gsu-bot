<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeSource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DataSourceController extends Controller
{
    /**
     * Set up a runtime database connection from provided credentials.
     */
    protected function setupConnection(array $config): string
    {
        $connectionName = 'dynamic_datasource';

        Config::set("database.connections.{$connectionName}", [
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

        // Purge any cached connection so new config takes effect
        DB::purge($connectionName);

        return $connectionName;
    }

    /**
     * Get table names scoped to a specific database only.
     */
    protected function getTablesForDatabase(string $connectionName, string $database): array
    {
        $rows = DB::connection($connectionName)
            ->select('SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME', [$database]);

        return array_map(fn($row) => $row->TABLE_NAME, $rows);
    }

    /**
     * GET /api/admin/data-sources/tables
     * List available MySQL tables from the configured or provided connection.
     */
    public function tables(Request $request): JsonResponse
    {
        try {
            if ($request->has('host') || $request->has('database')) {
                // Use dynamic connection from provided credentials
                $connectionName = $this->setupConnection([
                    'host'     => $request->input('host', '127.0.0.1'),
                    'port'     => $request->input('port', '3306'),
                    'database' => $request->input('database', ''),
                    'username' => $request->input('username', 'root'),
                    'password' => $request->input('password', ''),
                ]);
            } else {
                $connectionName = $request->input('connection', 'mysql');
            }

            $database = $request->input('database', '');
            $tables = $this->getTablesForDatabase($connectionName, $database);

            return response()->json([
                'connection' => $connectionName,
                'tables' => $tables,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Could not connect to the database. Check your configuration.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * GET /api/admin/data-sources/tables/{table}/columns
     * Get columns for a specific table.
     */
    public function columns(Request $request, string $table): JsonResponse
    {
        try {
            if ($request->has('host') || $request->has('database')) {
                $connectionName = $this->setupConnection([
                    'host'     => $request->input('host', '127.0.0.1'),
                    'port'     => $request->input('port', '3306'),
                    'database' => $request->input('database', ''),
                    'username' => $request->input('username', 'root'),
                    'password' => $request->input('password', ''),
                ]);
            } else {
                $connectionName = $request->input('connection', 'mysql');
            }

            $columns = Schema::connection($connectionName)->getColumnListing($table);

            // Try to get column types for richer schema info
            $columnDetails = [];
            try {
                $rawColumns = DB::connection($connectionName)
                    ->select("SHOW COLUMNS FROM `{$table}`");
                foreach ($rawColumns as $col) {
                    $columnDetails[] = [
                        'name' => $col->Field,
                        'type' => $col->Type,
                        'nullable' => $col->Null === 'YES',
                        'key' => $col->Key,
                        'default' => $col->Default,
                    ];
                }
            } catch (\Exception $e) {
                // Fall back to simple column names
                $columnDetails = array_map(fn($c) => ['name' => $c, 'type' => 'unknown'], $columns);
            }

            return response()->json([
                'table' => $table,
                'columns' => $columns,
                'column_details' => $columnDetails,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Could not retrieve columns.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * POST /api/admin/data-sources/crawl
     * Crawl a MySQL database to discover all tables and their schemas.
     * The AI uses this to understand the database structure before querying.
     */
    public function crawl(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'host'     => 'sometimes|string',
            'port'     => 'sometimes|string',
            'database' => 'required|string',
            'username' => 'sometimes|string',
            'password' => 'nullable|string',
            'source_id' => 'sometimes|integer|exists:knowledge_sources,id',
        ]);

        try {
            $connectionName = $this->setupConnection([
                'host'     => $validated['host'] ?? '127.0.0.1',
                'port'     => $validated['port'] ?? '3306',
                'database' => $validated['database'],
                'username' => $validated['username'] ?? 'root',
                'password' => $validated['password'] ?? '',
            ]);

            $tables = $this->getTablesForDatabase($connectionName, $validated['database']);
            $schema = [];

            foreach ($tables as $table) {
                try {
                    $rawColumns = DB::connection($connectionName)
                        ->select("SHOW COLUMNS FROM `{$table}`");

                    $cols = [];
                    foreach ($rawColumns as $col) {
                        $cols[] = [
                            'name' => $col->Field,
                            'type' => $col->Type,
                            'nullable' => $col->Null === 'YES',
                            'key' => $col->Key,
                            'default' => $col->Default,
                        ];
                    }

                    // Get sample row count
                    $count = DB::connection($connectionName)
                        ->table($table)->count();

                    // Get sample data rows so LLM can understand what values exist
                    $sampleData = [];
                    try {
                        $sampleData = DB::connection($connectionName)
                            ->table($table)
                            ->limit(5)
                            ->get()
                            ->map(fn ($row) => (array) $row)
                            ->toArray();
                    } catch (\Exception $e) {
                        // Sample data is best-effort
                    }

                    $schema[$table] = [
                        'columns' => $cols,
                        'row_count' => $count,
                        'sample_data' => $sampleData,
                    ];
                } catch (\Exception $e) {
                    $schema[$table] = [
                        'columns' => [],
                        'row_count' => 0,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            // If source_id provided, save crawled schema to the knowledge source
            if (!empty($validated['source_id'])) {
                $source = KnowledgeSource::findOrFail($validated['source_id']);
                $source->update(['crawled_schema' => $schema]);
            }

            return response()->json([
                'database' => $validated['database'],
                'tables_count' => count($tables),
                'schema' => $schema,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Could not crawl the database. Check credentials and connectivity.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * POST /api/admin/data-sources/test-connection
     * Test connection to a MySQL database with given credentials.
     */
    public function testConnection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'host'     => 'sometimes|string',
            'port'     => 'sometimes|string',
            'database' => 'required|string',
            'username' => 'sometimes|string',
            'password' => 'nullable|string',
        ]);

        try {
            $connectionName = $this->setupConnection([
                'host'     => $validated['host'] ?? '127.0.0.1',
                'port'     => $validated['port'] ?? '3306',
                'database' => $validated['database'],
                'username' => $validated['username'] ?? 'root',
                'password' => $validated['password'] ?? '',
            ]);

            DB::connection($connectionName)->getPdo();
            $tables = $this->getTablesForDatabase($connectionName, $validated['database']);

            return response()->json([
                'success' => true,
                'message' => 'Connection successful.',
                'tables_count' => count($tables),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * POST /api/admin/data-sources/configure
     * Configure a MySQL database as a knowledge source for LLM function calling.
     */
    public function configure(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'              => 'required|string|max:255',
            'description'       => 'sometimes|string',
            'category'          => 'required|in:student_info,staff_info,general_enquiry',
            'host'              => 'sometimes|string',
            'port'              => 'sometimes|string',
            'database'          => 'required|string',
            'username'          => 'sometimes|string',
            'password'          => 'nullable|string',
            'table_descriptions' => 'sometimes|array',
            'table_descriptions.*.table' => 'required_with:table_descriptions|string',
            'table_descriptions.*.description' => 'required_with:table_descriptions|string',
        ]);

        $host = $validated['host'] ?? '127.0.0.1';
        $port = $validated['port'] ?? '3306';
        $database = $validated['database'];
        $username = $validated['username'] ?? 'root';
        $password = $validated['password'] ?? '';

        // Attempt to crawl the schema automatically
        $crawledSchema = null;
        try {
            $connectionName = $this->setupConnection([
                'host' => $host,
                'port' => $port,
                'database' => $database,
                'username' => $username,
                'password' => $password,
            ]);

            $tables = $this->getTablesForDatabase($connectionName, $database);
            $crawledSchema = [];

            foreach ($tables as $table) {
                try {
                    $rawColumns = DB::connection($connectionName)
                        ->select("SHOW COLUMNS FROM `{$table}`");
                    $cols = [];
                    foreach ($rawColumns as $col) {
                        $cols[] = [
                            'name' => $col->Field,
                            'type' => $col->Type,
                            'key' => $col->Key,
                        ];
                    }
                    $count = DB::connection($connectionName)->table($table)->count();

                    // Get sample data rows so LLM can see real values
                    $sampleData = [];
                    try {
                        $sampleData = DB::connection($connectionName)
                            ->table($table)
                            ->limit(5)
                            ->get()
                            ->map(fn ($row) => (array) $row)
                            ->toArray();
                    } catch (\Exception $e) {
                        // Sample data is best-effort
                    }

                    $crawledSchema[$table] = ['columns' => $cols, 'row_count' => $count, 'sample_data' => $sampleData];
                } catch (\Exception $e) {
                    $crawledSchema[$table] = ['columns' => [], 'error' => $e->getMessage()];
                }
            }
        } catch (\Exception $e) {
            Log::warning('Auto-crawl failed during configure: ' . $e->getMessage());
        }

        $source = KnowledgeSource::create([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? '',
            'type'        => 'database',
            'config'      => [
                'host'     => $host,
                'port'     => $port,
                'database' => $database,
                'username' => $username,
                'password' => $password,
            ],
            'category'           => $validated['category'],
            'is_active'          => true,
            'table_descriptions' => $validated['table_descriptions'] ?? [],
            'crawled_schema'     => $crawledSchema,
        ]);

        return response()->json([
            'message' => 'Data source configured successfully.',
            'source' => $source,
            'crawled' => $crawledSchema !== null,
        ], 201);
    }

    /**
     * POST /api/admin/data-sources/test
     * Test a query against a configured data source.
     */
    public function test(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'source_id'   => 'required|integer|exists:knowledge_sources,id',
            'query_param' => 'required|string',
            'table'       => 'sometimes|string',
        ]);

        $source = KnowledgeSource::findOrFail($validated['source_id']);

        if ($source->type !== 'database') {
            return response()->json(['message' => 'Only database sources can be tested here.'], 422);
        }

        try {
            $config = $source->config;
            $connectionName = $this->setupConnection([
                'host'     => $config['host'] ?? '127.0.0.1',
                'port'     => $config['port'] ?? '3306',
                'database' => $config['database'] ?? '',
                'username' => $config['username'] ?? 'root',
                'password' => $config['password'] ?? '',
            ]);

            // If a specific table provided, query it; otherwise use first table
            $table = $validated['table'] ?? null;
            if (!$table && !empty($source->table_descriptions)) {
                $table = $source->table_descriptions[0]['table'] ?? null;
            }

            if (!$table) {
                return response()->json(['message' => 'No table specified for testing.'], 422);
            }

            $results = DB::connection($connectionName)
                ->table($table)
                ->limit(5)
                ->get();

            return response()->json([
                'success' => true,
                'table' => $table,
                'results' => $results,
                'count' => count($results),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Query failed: ' . $e->getMessage(),
            ], 422);
        }
    }
}
