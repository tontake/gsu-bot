# GSU SmartAssist — Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                          │
│  React 18 · Vite · Tailwind CSS · React Router · Axios             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  HTTPS / JSON
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Laravel 12 API (PHP 8.2)                     │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌────────────────┐  │
│  │  Sanctum  │  │ Middleware │  │Controllers│  │   Services     │  │
│  │  (Auth)   │  │ Admin Gate │  │  (REST)   │  │ LlmService     │  │
│  │           │  │ Throttle   │  │           │  │ TranslationSvc │  │
│  └──────────┘  └────────────┘  └───────────┘  └───────┬────────┘  │
│                                                        │           │
│  ┌────────────────────────────────────┐                │           │
│  │         Eloquent ORM / Models      │                │           │
│  └────────────────┬───────────────────┘                │           │
└───────────────────┼────────────────────────────────────┼───────────┘
                    │                                    │
         ┌──────────▼──────────┐              ┌──────────▼──────────┐
         │   SQLite / MySQL    │              │    OpenAI API       │
         │   (Application DB)  │              │  (GPT-4o / LLM)    │
         └─────────────────────┘              └─────────────────────┘
```

---

## Project Structure

```
gsu-bot/
├── README.md
├── docs/
│   ├── architecture.md          ← You are here
│   ├── user-guide.md
│   ├── api-documentation.md
│   └── screenshots/
├── backend/                     ← Laravel 12
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── OnboardingController.php
│   │   │   │   ├── ChatController.php
│   │   │   │   ├── TicketController.php
│   │   │   │   ├── NotificationController.php
│   │   │   │   └── Admin/
│   │   │   │       ├── DashboardController.php
│   │   │   │       ├── KnowledgeBaseController.php
│   │   │   │       ├── KnowledgeSourceController.php
│   │   │   │       ├── DataSourceController.php
│   │   │   │       ├── AdminTicketController.php
│   │   │   │       ├── UserController.php
│   │   │   │       ├── AuditLogController.php
│   │   │   │       ├── FaqAnalyticsController.php
│   │   │   │       └── SettingsController.php
│   │   │   └── Middleware/
│   │   │       ├── EnsureUserIsAdmin.php
│   │   │       └── ThrottleByScope.php
│   │   ├── Models/              (11 models)
│   │   ├── Services/
│   │   │   ├── LlmService.php
│   │   │   └── TranslationService.php
│   │   └── Providers/
│   ├── database/
│   │   ├── migrations/          (14 migrations)
│   │   └── seeders/
│   │       ├── DatabaseSeeder.php
│   │       └── UserSeeder.php
│   ├── routes/
│   │   └── api.php
│   └── config/
│       └── services.php
└── frontend/                    ← React + Vite
    ├── src/
    │   ├── App.jsx              (Router config)
    │   ├── main.jsx
    │   ├── index.css            (Tailwind CSS)
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── components/
    │   │   ├── AppLayout.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   └── NotificationBell.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── OnboardingPage.jsx
    │   │   ├── ResetPasswordPage.jsx
    │   │   ├── ChatPage.jsx
    │   │   ├── TicketsPage.jsx
    │   │   └── admin/
    │   │       ├── DashboardPage.jsx
    │   │       ├── KnowledgeBasePage.jsx
    │   │       ├── DataSourcesPage.jsx
    │   │       ├── AdminTicketsPage.jsx
    │   │       ├── UsersPage.jsx
    │   │       ├── AuditLogPage.jsx
    │   │       ├── FaqAnalyticsPage.jsx
    │   │       └── SettingsPage.jsx
    │   └── services/
    │       └── api.js
    └── vite.config.js
```

---

## Database Schema

### Entity-Relationship Summary

```
users ──┬─< chat_sessions ──< chat_messages
        ├─< tickets ──< ticket_replies
        ├─< audit_logs
        └─< notifications

knowledge_bases ──< knowledge_sources

system_settings (key-value)
faq_analytics   (aggregated question stats)
```

### Tables

| Table               | Purpose                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `users`             | All users — admin, staff, student. Extended with role, DOB, national_id, security_code, google_id |
| `chat_sessions`     | One per conversation thread                                                                       |
| `chat_messages`     | Individual messages (role: user/assistant/system)                                                 |
| `tickets`           | Support tickets raised by users                                                                   |
| `ticket_replies`    | Threaded replies on tickets                                                                       |
| `knowledge_bases`   | Top-level grouping of knowledge                                                                   |
| `knowledge_sources` | Configured data sources (DB tables, APIs) for LLM function calling                                |
| `faq_analytics`     | Tracks frequently asked questions                                                                 |
| `audit_logs`        | Records translations, function calls, logins, etc.                                                |
| `system_settings`   | App-wide configuration (key/value)                                                                |
| `notifications`     | User-facing notifications (ticket replies, etc.)                                                  |

---

## Authentication & Authorization

### Flow

```
┌───────────┐     POST /auth/register      ┌────────────┐
│  Browser   │──────────────────────────────▶│  Sanctum   │
│            │     POST /auth/login         │  Token Auth │
│            │──────────────────────────────▶│            │
│            │     GET  /auth/google/*      │  + Google   │
│            │──────────────────────────────▶│    OAuth    │
└───────────┘                               └─────┬──────┘
                                                  │
                                    Bearer token in header
                                                  │
                               ┌──────────────────▼──────────────────┐
                               │         Middleware Pipeline          │
                               │                                     │
                               │  auth:sanctum → EnsureUserIsAdmin   │
                               │             → ThrottleByScope       │
                               └─────────────────────────────────────┘
```

- **Token-based** via Laravel Sanctum (stored in `personal_access_tokens`)
- **Google OAuth** via Laravel Socialite (redirect → callback → auto-register)
- **Role guard**: `EnsureUserIsAdmin` middleware on all `/admin/*` routes
- **Rate limiting**: `ThrottleByScope` with configurable limits per route group

### Password Reset (Unauthenticated)

Users who are locked out use their **security code** (generated during onboarding) combined with email, DOB, and national ID to verify identity and reset their password — no email link required.

---

## AI / LLM Integration

### Chat Flow

```
User Message
     │
     ▼
TranslationService.detectAndTranslate()
     │  ← detects Shona (sn) / Ndebele (nd) → translates to English
     │  ← logs translation to audit_logs
     ▼
LlmService.chat()
     │
     ├── Builds conversation history from chat_messages
     ├── Attaches system prompt
     ├── Includes function definitions:
     │     • reset_user_password (built-in)
     │     • Dynamic sources from knowledge_sources table
     │
     ├── Sends to OpenAI API (gpt-4o)
     │
     ├── If function_call returned:
     │     ├── executePasswordReset()
     │     └── executeSourceQuery() → runs DB query or API call
     │     └── loops (max 5 iterations)
     │
     └── Returns final response + functions_called list
```

### Function Calling

The LLM can autonomously query configured MySQL tables. Admins configure these via the **Data Sources** page:

| Category          | Example Table     | Description                    |
| ----------------- | ----------------- | ------------------------------ |
| `student_info`    | `student_records` | Enrollment, grades, status     |
| `staff_info`      | `staff_directory` | Staff contacts, departments    |
| `general_enquiry` | `faq_data`        | General university information |

Each source becomes an OpenAI function definition. When the LLM decides it needs data, it calls the function, the backend executes the query, and feeds results back to the model.

---

## Frontend Architecture

### Routing

| Path                    | Component         | Access                     |
| ----------------------- | ----------------- | -------------------------- |
| `/login`                | LoginPage         | Public                     |
| `/register`             | RegisterPage      | Public                     |
| `/reset-password`       | ResetPasswordPage | Public                     |
| `/onboarding`           | OnboardingPage    | Auth only (pre-onboarding) |
| `/chat`                 | ChatPage          | Auth                       |
| `/tickets`              | TicketsPage       | Auth                       |
| `/admin`                | DashboardPage     | Admin                      |
| `/admin/knowledge-base` | KnowledgeBasePage | Admin                      |
| `/admin/data-sources`   | DataSourcesPage   | Admin                      |
| `/admin/tickets`        | AdminTicketsPage  | Admin                      |
| `/admin/users`          | UsersPage         | Admin                      |
| `/admin/audit-log`      | AuditLogPage      | Admin                      |
| `/admin/faq-analytics`  | FaqAnalyticsPage  | Admin                      |
| `/admin/settings`       | SettingsPage      | Admin                      |

### State Management

- **AuthContext** — global auth state via React Context (user object, token, login/logout/register methods)
- **Per-page local state** — each page manages its own data fetching and UI state
- **API layer** — centralized Axios instance (`services/api.js`) with automatic Bearer token injection and 401 redirect

---

## Notification System

```
Admin replies to ticket
       │
       ▼
AdminTicketController.reply()
       │
       ├── Creates TicketReply
       └── Creates Notification (type: 'ticket_reply', user_id: ticket owner)

Frontend:
  NotificationBell component polls GET /notifications every 30s
  Shows unread count badge
  Dropdown shows latest notifications
  Click marks as read → links to relevant ticket
```

---

## Security Considerations

| Area           | Approach                                                |
| -------------- | ------------------------------------------------------- |
| Authentication | Sanctum bearer tokens, hashed passwords                 |
| Authorization  | Role-based middleware (`EnsureUserIsAdmin`)             |
| Rate limiting  | `ThrottleByScope` middleware per route group            |
| CORS           | Sanctum `statefulApi()` with configured allowed origins |
| Sensitive data | `security_code` and `national_id` hidden from JSON      |
| Password reset | Multi-factor: email + DOB + national_id + security_code |
| API keys       | OpenAI key stored in `.env`, never exposed to frontend  |

---

## Technology Stack

| Layer    | Technology                        | Version |
| -------- | --------------------------------- | ------- |
| Frontend | React                             | 18+     |
| Bundler  | Vite                              | 7.x     |
| Styling  | Tailwind CSS                      | 4.x     |
| Icons    | Heroicons                         | 2.x     |
| Backend  | Laravel                           | 12.x    |
| Language | PHP                               | 8.2+    |
| Auth     | Laravel Sanctum                   | 4.x     |
| OAuth    | Laravel Socialite                 | 5.x     |
| Database | SQLite (dev) / MySQL (production) | —       |
| AI       | OpenAI API (GPT-4o)               | —       |
| Runtime  | Node.js (frontend build)          | 20+     |
