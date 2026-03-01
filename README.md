# GSU SmartAssist Bot

An AI-powered university assistant chatbot for Gwanda State University (GSU). Built with Laravel (backend) and React + OpenAI ChatKit (frontend).

## Project Structure

```
├── README.md
├── backend/              # Laravel 12 API
├── frontend/             # React + Vite + OpenAI ChatKit
├── docs/
│   ├── architecture-diagram.png
│   ├── screenshots/
│   └── api-documentation.md
```

## Features

- **AI Chat** — OpenAI-powered chatbot with function calling (password reset, student/staff info lookup)
- **Auto Translation** — Shona / Ndebele messages auto-translated to English; audit log records translations
- **Google OAuth & Email Auth** — Onboarding asks role (student/staff) and generates a security code for unauthenticated password reset
- **Past Chat History** — Users can revisit all previous chat sessions
- **Ticket System** — Users create support tickets; admins reply and users see notifications
- **Admin Dashboard** — Knowledge base, MySQL data source config, FAQ analytics, user management, audit log
- **Function Calling** — LLM can call configured APIs/DB queries for student info, staff info, general enquiries

## Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+
- npm or yarn
- SQLite (default) or MySQL
- OpenAI API key

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set OPENAI_API_KEY, DB credentials, Google OAuth keys
composer install
php artisan key:generate
php artisan migrate
php artisan serve --port=8000
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env — set VITE_API_URL=http://localhost:8000/api
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Environment Variables

### Backend (.env)

| Variable               | Description                                |
| ---------------------- | ------------------------------------------ |
| `OPENAI_API_KEY`       | OpenAI API key for chat & function calling |
| `OPENAI_MODEL`         | Model to use (default: `gpt-4o`)           |
| `DB_CONNECTION`        | `sqlite` or `mysql`                        |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                     |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                 |
| `GOOGLE_REDIRECT_URI`  | Google OAuth callback URL                  |

### Frontend (.env)

| Variable       | Description          |
| -------------- | -------------------- |
| `VITE_API_URL` | Backend API base URL |

## API Documentation

See [docs/api-documentation.md](docs/api-documentation.md) for full API reference.

## License

MIT
