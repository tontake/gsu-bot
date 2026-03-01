<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KnowledgeSource extends Model
{
    protected $fillable = [
        'name',
        'description',
        'type',
        'config',
        'category',
        'is_active',
        'table_descriptions',
        'crawled_schema',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'is_active' => 'boolean',
            'table_descriptions' => 'array',
            'crawled_schema' => 'array',
        ];
    }
}
