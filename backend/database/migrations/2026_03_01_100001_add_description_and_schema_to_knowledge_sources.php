<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('knowledge_sources', function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
            $table->json('table_descriptions')->nullable()->after('config');  // User-provided table descriptions
            $table->json('crawled_schema')->nullable()->after('table_descriptions');  // Auto-crawled schema
        });
    }

    public function down(): void
    {
        Schema::table('knowledge_sources', function (Blueprint $table) {
            $table->dropColumn(['description', 'table_descriptions', 'crawled_schema']);
        });
    }
};
