<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('knowledge_bases');

        Schema::create('knowledge_bases', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['api', 'website', 'text']);
            $table->text('description');          // Brief description so LLM knows what it does
            $table->text('content');               // URL for api/website, text content for text type
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_bases');

        Schema::create('knowledge_bases', function (Blueprint $table) {
            $table->id();
            $table->string('category');
            $table->text('question');
            $table->text('answer');
            $table->json('keywords')->nullable();
            $table->timestamps();
        });
    }
};
