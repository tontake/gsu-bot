<?php

use App\Http\Controllers\Admin\AdminTicketController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DataSourceController;
use App\Http\Controllers\Admin\FaqAnalyticsController;
use App\Http\Controllers\Admin\KnowledgeBaseController;
use App\Http\Controllers\Admin\KnowledgeSourceController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\TicketController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->middleware('throttle.scope:auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    // Google OAuth
    Route::get('/google/redirect', [AuthController::class, 'googleRedirect']);
    Route::get('/google/callback', [AuthController::class, 'googleCallback']);

    // Unauthenticated password reset (LLM function call)
    Route::post('/reset-password-unauthenticated', [AuthController::class, 'resetPasswordUnauthenticated']);

    // Authenticated routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
        Route::post('/set-security-code', [AuthController::class, 'setSecurityCode']);
        Route::post('/acknowledge-security-code', [AuthController::class, 'acknowledgeSecurityCode']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

/*
|--------------------------------------------------------------------------
| Onboarding Routes
|--------------------------------------------------------------------------
*/
Route::prefix('onboarding')->middleware(['auth:sanctum', 'throttle.scope:general'])->group(function () {
    Route::post('/complete', [OnboardingController::class, 'complete']);
});

/*
|--------------------------------------------------------------------------
| Chat Routes
|--------------------------------------------------------------------------
*/
Route::prefix('chat')->middleware(['auth:sanctum', 'throttle.scope:chat'])->group(function () {
    Route::post('/send', [ChatController::class, 'send']);
    Route::get('/sessions', [ChatController::class, 'sessions']);
    Route::get('/sessions/{session_id}/messages', [ChatController::class, 'messages']);
    Route::delete('/sessions/{session_id}', [ChatController::class, 'deleteSession']);
    Route::delete('/sessions', [ChatController::class, 'deleteAllSessions']);
    Route::post('/reset-password', [ChatController::class, 'resetPassword']);
});

/*
|--------------------------------------------------------------------------
| Ticket Routes
|--------------------------------------------------------------------------
*/
Route::prefix('tickets')->middleware(['auth:sanctum', 'throttle.scope:general'])->group(function () {
    Route::post('/', [TicketController::class, 'store']);
    Route::get('/', [TicketController::class, 'index']);
    Route::get('/{id}', [TicketController::class, 'show']);
    Route::post('/{id}/reply', [TicketController::class, 'reply']);
});

/*
|--------------------------------------------------------------------------
| Notification Routes
|--------------------------------------------------------------------------
*/
Route::prefix('notifications')->middleware(['auth:sanctum', 'throttle.scope:general'])->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::put('/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/read-all', [NotificationController::class, 'markAllRead']);
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->middleware(['auth:sanctum', 'admin', 'throttle.scope:admin'])->group(function () {

    // Knowledge Base
    Route::prefix('knowledge-base')->group(function () {
        Route::get('/', [KnowledgeBaseController::class, 'index']);
        Route::post('/', [KnowledgeBaseController::class, 'store']);
        Route::put('/{id}', [KnowledgeBaseController::class, 'update']);
        Route::delete('/{id}', [KnowledgeBaseController::class, 'destroy']);
    });

    // Knowledge Sources
    Route::prefix('knowledge-sources')->group(function () {
        Route::get('/', [KnowledgeSourceController::class, 'index']);
        Route::post('/', [KnowledgeSourceController::class, 'store']);
        Route::put('/{id}', [KnowledgeSourceController::class, 'update']);
        Route::delete('/{id}', [KnowledgeSourceController::class, 'destroy']);
    });

    // Tickets (Admin)
    Route::get('/tickets', [AdminTicketController::class, 'index']);
    Route::get('/tickets/{id}', [AdminTicketController::class, 'show']);
    Route::put('/tickets/{id}/reply', [AdminTicketController::class, 'reply']);
    Route::put('/tickets/{id}/status', [AdminTicketController::class, 'updateStatus']);

    // FAQ Analytics
    Route::get('/faq-analytics', [FaqAnalyticsController::class, 'index']);
    Route::post('/faq-analytics/{id}/enhance', [FaqAnalyticsController::class, 'enhance']);

    // Users
    Route::post('/users', [UserController::class, 'store']);
    Route::post('/users/import-csv', [UserController::class, 'importCsv']);
    Route::get('/users', [UserController::class, 'index']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::post('/users/{id}/generate-security-code', [UserController::class, 'generateSecurityCode']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Settings
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings', [SettingsController::class, 'update']);

    // Audit Log
    Route::get('/audit-log', [AuditLogController::class, 'index']);

    // Data Sources (MySQL database configuration for LLM function calling)
    Route::prefix('data-sources')->group(function () {
        Route::get('/tables', [DataSourceController::class, 'tables']);
        Route::get('/tables/{table}/columns', [DataSourceController::class, 'columns']);
        Route::post('/configure', [DataSourceController::class, 'configure']);
        Route::post('/test', [DataSourceController::class, 'test']);
        Route::post('/test-connection', [DataSourceController::class, 'testConnection']);
        Route::post('/crawl', [DataSourceController::class, 'crawl']);
    });
});
