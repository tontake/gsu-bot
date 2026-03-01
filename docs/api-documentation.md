# GSU SmartAssist – API Documentation

**Base URL:** `http://localhost:8000/api`

---

## Common Headers

| Header          | Value              | Required         |
| --------------- | ------------------ | ---------------- |
| `Content-Type`  | `application/json` | All requests     |
| `Accept`        | `application/json` | All requests     |
| `Authorization` | `Bearer <token>`   | Protected routes |

---

## Error Response Format

All error responses follow a consistent structure:

```json
{
  "message": "A human-readable error description.",
  "errors": {
    "field_name": ["Validation error detail."]
  }
}
```

### Common Status Codes

| Code  | Meaning                                |
| ----- | -------------------------------------- |
| `200` | OK – Request succeeded                 |
| `201` | Created – Resource created             |
| `204` | No Content – Successful delete         |
| `400` | Bad Request – Validation error         |
| `401` | Unauthorized – Missing / invalid token |
| `403` | Forbidden – Insufficient permissions   |
| `404` | Not Found – Resource does not exist    |
| `422` | Unprocessable Entity – Semantic error  |
| `429` | Too Many Requests – Rate limited       |
| `500` | Internal Server Error                  |

---

## Rate Limiting

API requests are rate-limited per user/IP:

| Scope            | Limit            |
| ---------------- | ---------------- |
| Authentication   | 10 req / minute  |
| Chat             | 30 req / minute  |
| General (authed) | 60 req / minute  |
| Admin            | 120 req / minute |

Exceeded limits return `429 Too Many Requests` with a `Retry-After` header (seconds).

---

## Pagination

List endpoints support pagination via query parameters:

| Parameter  | Type    | Default | Description              |
| ---------- | ------- | ------- | ------------------------ |
| `page`     | integer | `1`     | Page number              |
| `per_page` | integer | `15`    | Items per page (max 100) |

**Paginated Response Envelope:**

```json
{
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 73
  }
}
```

---

## Authentication

### POST `/auth/register`

Register a new user.

**Body:**

```json
{
  "name": "John Doe",
  "email": "john@gsu.ac.zw",
  "password": "password123",
  "password_confirmation": "password123",
  "role": "student"
}
```

**Response:** `201 Created`

```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@gsu.ac.zw",
    "role": "student"
  },
  "token": "Bearer ..."
}
```

---

### POST `/auth/login`

Authenticate user.

**Body:**

```json
{
  "email": "john@gsu.ac.zw",
  "password": "password123"
}
```

**Response:** `200 OK`

```json
{
  "user": { ... },
  "token": "Bearer ..."
}
```

---

### GET `/auth/google/redirect`

Redirect to Google OAuth.

### GET `/auth/google/callback`

Google OAuth callback — returns JWT token.

---

### POST `/auth/logout`

Logout (revoke token). **Requires Auth.**

---

### POST `/auth/reset-password-unauthenticated`

Reset password without login (used by LLM function call).

**Body:**

```json
{
  "email": "john@gsu.ac.zw",
  "date_of_birth": "1999-05-15",
  "national_id": "63-123456X12",
  "security_code": "ABC123",
  "new_password": "newPassword123"
}
```

---

### POST `/auth/reset-password`

Reset password for authenticated user. **Requires Auth.**

**Body:**

```json
{
  "new_password": "newPassword123"
}
```

---

### POST `/auth/set-security-code`

Set security code on first login. **Requires Auth.**

**Body:**

```json
{
  "security_code": "ABC123"
}
```

---

## Onboarding

### POST `/onboarding/complete`

Set user role (student/staff) during onboarding. **Requires Auth.**

**Body:**

```json
{
  "role": "student",
  "date_of_birth": "1999-05-15",
  "national_id": "63-123456X12"
}
```

---

## Chat

### POST `/chat/send`

Send a message to the chatbot. **Requires Auth.**

**Body:**

```json
{
  "message": "What are the admission requirements?",
  "session_id": "optional-existing-session-uuid"
}
```

**Response:** `200 OK`

```json
{
  "session_id": "uuid",
  "message": "What are the admission requirements?",
  "response": "GSU requires a minimum of 5 O-Level passes...",
  "translated": false,
  "original_language": "en",
  "timestamp": "2026-02-28T10:00:00Z"
}
```

---

### GET `/chat/sessions`

Get all chat sessions for authenticated user. **Requires Auth.**

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "session_id": "uuid",
    "created_at": "2026-02-28T10:00:00Z",
    "last_message_at": "2026-02-28T10:05:00Z",
    "message_count": 5
  }
]
```

---

### GET `/chat/sessions/{session_id}/messages`

Get all messages in a session. **Requires Auth.**

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "message": "Hello",
    "response": "Hi! How can I help you?",
    "timestamp": "2026-02-28T10:00:00Z"
  }
]
```

---

### POST `/chat/reset-password`

Password reset endpoint called by LLM function calling.

**Body:**

```json
{
  "email": "john@gsu.ac.zw",
  "date_of_birth": "1999-05-15",
  "national_id": "63-123456X12",
  "security_code": "ABC123"
}
```

---

## Tickets

### POST `/tickets`

Create a new support ticket. **Requires Auth.**

**Body:**

```json
{
  "subject": "Cannot access exam results",
  "message": "I am unable to view my semester 1 results.",
  "category": "academic"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "subject": "Cannot access exam results",
  "message": "I am unable to view my semester 1 results.",
  "category": "academic",
  "status": "open",
  "created_at": "2026-02-28T10:00:00Z",
  "updated_at": "2026-02-28T10:00:00Z"
}
```

---

### GET `/tickets`

Get user's tickets. **Requires Auth.** Supports pagination.

**Query Parameters:**

| Parameter  | Type   | Description                                   |
| ---------- | ------ | --------------------------------------------- |
| `status`   | string | Filter by status: `open`, `closed`, `pending` |
| `page`     | int    | Page number                                   |
| `per_page` | int    | Results per page                              |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "subject": "Cannot access exam results",
      "category": "academic",
      "status": "open",
      "created_at": "2026-02-28T10:00:00Z",
      "last_reply_at": null
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 1
  }
}
```

---

### GET `/tickets/{id}`

Get ticket detail with conversation thread. **Requires Auth.**

**Response:** `200 OK`

```json
{
  "id": 1,
  "subject": "Cannot access exam results",
  "message": "I am unable to view my semester 1 results.",
  "category": "academic",
  "status": "open",
  "created_at": "2026-02-28T10:00:00Z",
  "updated_at": "2026-02-28T11:00:00Z",
  "replies": [
    {
      "id": 1,
      "reply": "We are looking into this for you.",
      "replied_by": {
        "id": 2,
        "name": "Admin User",
        "role": "admin"
      },
      "created_at": "2026-02-28T11:00:00Z"
    }
  ]
}
```

---

## Admin Endpoints (Requires Admin Role)

### Knowledge Base

#### GET `/admin/knowledge-base`

List all knowledge base entries.

#### POST `/admin/knowledge-base`

Create a knowledge base entry.

**Body:**

```json
{
  "category": "admissions",
  "question": "What are the admission requirements?",
  "answer": "GSU requires...",
  "keywords": ["admission", "requirements", "apply"]
}
```

#### PUT `/admin/knowledge-base/{id}`

Update a knowledge base entry.

#### DELETE `/admin/knowledge-base/{id}`

Delete a knowledge base entry.

---

### Knowledge Sources

#### GET `/admin/knowledge-sources`

List all knowledge sources (databases, APIs, websites).

#### POST `/admin/knowledge-sources`

Add a knowledge source.

**Body (Database type):**

```json
{
  "name": "Student Records",
  "type": "database",
  "config": {
    "table": "students",
    "connection": "mysql",
    "query_template": "SELECT * FROM students WHERE student_id = :param"
  },
  "category": "student_info",
  "is_active": true
}
```

**Body (API type):**

```json
{
  "name": "Library API",
  "type": "api",
  "config": {
    "endpoint": "https://library.gsu.ac.zw/api/books",
    "method": "GET",
    "headers": { "Authorization": "Bearer ..." }
  },
  "category": "library",
  "is_active": true
}
```

**Body (Website type):**

```json
{
  "name": "GSU Homepage",
  "type": "website",
  "config": {
    "url": "https://www.gsu.ac.zw",
    "scrape_selector": ".content"
  },
  "category": "general",
  "is_active": true
}
```

#### PUT `/admin/knowledge-sources/{id}`

Update a knowledge source.

#### DELETE `/admin/knowledge-sources/{id}`

Delete a knowledge source.

---

### Tickets (Admin)

#### GET `/admin/tickets`

List all tickets.

#### PUT `/admin/tickets/{id}/reply`

Reply to a ticket.

**Body:**

```json
{
  "reply": "Here is the information you requested..."
}
```

---

### FAQ Analytics

#### GET `/admin/faq-analytics`

View frequently asked questions for reinforcement learning.

**Response:**

```json
[
  {
    "question": "How do I apply?",
    "frequency": 45,
    "has_kb_match": true,
    "satisfaction_rate": 0.85
  }
]
```

#### POST `/admin/faq-analytics/{id}/enhance`

Use FAQ data to enhance LLM training.

---

### Users (Admin)

#### GET `/admin/users`

List all users. Supports pagination.

**Query Parameters:**

| Parameter  | Type   | Description                                 |
| ---------- | ------ | ------------------------------------------- |
| `role`     | string | Filter by role: `student`, `staff`, `admin` |
| `search`   | string | Search by name or email                     |
| `page`     | int    | Page number                                 |
| `per_page` | int    | Results per page                            |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@gsu.ac.zw",
      "role": "student",
      "created_at": "2026-01-15T08:00:00Z",
      "last_login_at": "2026-02-28T09:30:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 15,
    "total": 150
  }
}
```

---

#### PUT `/admin/users/{id}`

Update user details.

**Body:**

```json
{
  "name": "John Doe",
  "email": "john@gsu.ac.zw",
  "role": "staff"
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@gsu.ac.zw",
  "role": "staff",
  "updated_at": "2026-02-28T12:00:00Z"
}
```

---

#### DELETE `/admin/users/{id}`

Delete a user account.

**Response:** `204 No Content`

---

### Dashboard

#### GET `/admin/dashboard/stats`

Get dashboard statistics.

**Response:**

```json
{
  "total_users": 1500,
  "total_sessions": 5000,
  "total_tickets": 50,
  "open_tickets": 10,
  "knowledge_base_count": 200,
  "popular_categories": [
    { "name": "admissions", "count": 320 },
    { "name": "fees", "count": 215 },
    { "name": "academic", "count": 180 }
  ],
  "avg_response_time_ms": 1200,
  "satisfaction_rate": 0.87
}
```

---

### System Settings (Admin)

#### GET `/admin/settings`

Retrieve current system settings.

**Response:** `200 OK`

```json
{
  "llm_model": "gpt-4o",
  "max_tokens": 2048,
  "temperature": 0.7,
  "translation_enabled": true,
  "supported_languages": ["en", "sn", "nd"],
  "auto_ticket_creation": true,
  "maintenance_mode": false
}
```

---

#### PUT `/admin/settings`

Update system settings.

**Body:**

```json
{
  "llm_model": "gpt-4o",
  "max_tokens": 4096,
  "temperature": 0.5,
  "translation_enabled": true,
  "maintenance_mode": false
}
```

**Response:** `200 OK`

---

### Audit Log (Admin)

#### GET `/admin/audit-log`

List audit log entries. Supports pagination.

**Query Parameters:**

| Parameter | Type   | Description                                  |
| --------- | ------ | -------------------------------------------- |
| `user_id` | int    | Filter by user                               |
| `action`  | string | Filter by action (e.g. `login`, `kb_update`) |
| `from`    | string | Start date (ISO 8601)                        |
| `to`      | string | End date (ISO 8601)                          |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "action": "kb_update",
      "description": "Updated knowledge base entry #15",
      "ip_address": "192.168.1.10",
      "created_at": "2026-02-28T14:30:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 15,
    "total": 42
  }
}
```

---

## WebSocket – Real-Time Chat (Optional)

**URL:** `ws://localhost:8000/ws/chat`

For real-time streaming of chatbot responses.

### Connection

Connect with an auth token as a query parameter:

```
ws://localhost:8000/ws/chat?token=<jwt_token>
```

### Client → Server

```json
{
  "event": "message",
  "data": {
    "session_id": "uuid",
    "message": "What are the library hours?"
  }
}
```

### Server → Client (streamed)

```json
{
  "event": "response.chunk",
  "data": {
    "session_id": "uuid",
    "chunk": "The library is open from ",
    "done": false
  }
}
```

```json
{
  "event": "response.done",
  "data": {
    "session_id": "uuid",
    "full_response": "The library is open from 8 AM to 10 PM on weekdays.",
    "translated": false,
    "original_language": "en"
  }
}
```
