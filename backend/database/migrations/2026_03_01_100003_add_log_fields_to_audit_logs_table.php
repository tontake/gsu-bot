<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->string('level', 20)->nullable()->after('action');
            $table->text('context')->nullable()->after('description');
            $table->string('channel', 50)->nullable()->after('level');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropColumn(['level', 'context', 'channel']);
        });
    }
};
