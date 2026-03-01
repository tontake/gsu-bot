<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FaqAnalytic extends Model
{
    protected $table = 'faq_analytics';

    protected $fillable = [
        'question',
        'frequency',
        'has_kb_match',
        'satisfaction_rate',
    ];

    protected function casts(): array
    {
        return [
            'has_kb_match' => 'boolean',
            'satisfaction_rate' => 'decimal:2',
        ];
    }
}
