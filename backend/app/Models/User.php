<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

// Relationships
use App\Models\ChatSession;
use App\Models\Ticket;
use App\Models\AuditLog;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'date_of_birth',
        'national_id',
        'security_code',
        'security_code_acknowledged',
        'google_id',
        'onboarding_completed',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'security_code',
        'national_id',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'date_of_birth' => 'date',
            'onboarding_completed' => 'boolean',
            'security_code_acknowledged' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function chatSessions()
    {
        return $this->hasMany(ChatSession::class);
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }
}
