<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faq_analytics', function (Blueprint $table) {
            $table->id();
            $table->text('question');
            $table->unsignedInteger('frequency')->default(1);
            $table->boolean('has_kb_match')->default(false);
            $table->decimal('satisfaction_rate', 3, 2)->default(0.00);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faq_analytics');
    }
};
