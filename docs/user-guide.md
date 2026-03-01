# GSU SmartAssist — User Guide

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Registration & Login](#2-registration--login)
3. [Onboarding](#3-onboarding)
4. [Chatting with SmartAssist](#4-chatting-with-smartassist)
5. [Support Tickets](#5-support-tickets)
6. [Notifications](#6-notifications)
7. [Resetting Your Password](#7-resetting-your-password)
8. [Admin Guide](#8-admin-guide)
   - [Dashboard](#81-dashboard)
   - [Knowledge Base](#82-knowledge-base)
   - [Data Sources](#83-data-sources)
   - [Ticket Management](#84-ticket-management)
   - [User Management](#85-user-management)
   - [Audit Log](#86-audit-log)
   - [FAQ Analytics](#87-faq-analytics)
   - [Settings](#88-settings)
9. [Demo Accounts](#9-demo-accounts)
10. [FAQ](#10-faq)

---

## 1. Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection

### Accessing the Application

1. Open your browser and navigate to the application URL (e.g. `http://localhost:5173` during development).
2. You will be redirected to the **Login** page.

---

## 2. Registration & Login

### Creating a New Account

1. Click **Sign up** on the login page.
2. Fill in your **Full Name**, **Email**, **Password**, and **Confirm Password**.
3. Click **Create Account**.
4. You will be redirected to the **Onboarding** page.

### Logging In with Email & Password

1. Enter your **Email** and **Password**.
2. Click **Sign In**.

### Logging In with Google

1. Click **Continue with Google**.
2. Select your Google account and authorize the application.
3. If this is your first login, you will be redirected to **Onboarding**.

---

## 3. Onboarding

After your first login, you must complete onboarding before using the chatbot.

### Steps

1. **Select your role**: Choose **Student** or **Staff**.
2. **Date of Birth**: Enter your date of birth.
3. **National ID**: Enter your national ID number (e.g. `63-123456A78`).
4. Click **Complete Setup**.

### Security Code

After completing onboarding, you will see a **Security Code** displayed on screen.

> ⚠️ **IMPORTANT**: Save this code in a safe place! You will need it to reset your password if you ever get locked out. The code looks like: `A1B2C3D4`

- Click **Copy to clipboard** to copy it.
- Click **I've saved my code — Continue** to proceed to the Chat page.

---

## 4. Chatting with SmartAssist

The Chat page is your main interface for asking questions about the university.

### Starting a Conversation

1. Click **New Chat** in the left sidebar (or just start typing if no previous sessions exist).
2. Type your message in the text box at the bottom.
3. Press **Enter** or click the send button (arrow icon).

### Features

- **Multi-language support**: You can ask in **English**, **Shona**, or **Ndebele**. The system automatically detects and translates your message to English before processing. The response will be in English.
- **Past chats**: All your previous conversations are listed in the left sidebar. Click any session to load its message history.
- **Smart responses**: The chatbot uses **RAG (Retrieval-Augmented Generation)** to query university databases with targeted SQL queries. It can look up student records, exam marks, programme details, and more — returning real data, not generic answers.
- **Source citations**: When the chatbot retrieves data from a database or knowledge base, it cites the source in its response so you know where the information came from.
- **Password reset via chat**: You can ask the chatbot to help reset your password. It will verify your identity using your security details.

### Managing Chats

- **Delete a single chat**: Hover over a chat session in the sidebar and click the **trash icon** to delete that conversation.
- **Clear all chats**: Click the **Clear All Chats** button at the top of the sidebar to delete all your conversation history.
- **Follow-up context**: The chatbot remembers the last 20 messages in a conversation, so you can ask follow-up questions naturally (e.g. "What are their marks?" after asking about a student).

### Tips

- Be specific with your questions (e.g. "What are the fees for BSc Computer Science?" instead of "Tell me about fees").
- The sidebar can be collapsed by clicking the menu icon for more screen space.
- You can start multiple separate conversations for different topics.

---

## 5. Support Tickets

For issues that the chatbot cannot resolve, you can raise a support ticket.

### Creating a Ticket

1. Navigate to **Tickets** from the sidebar.
2. Click the **+** button in the top right.
3. Fill in:
   - **Subject**: Brief description of the issue
   - **Category**: General, Academic, Financial, Technical, or Other
   - **Priority**: Low, Medium, High, or Urgent
   - **Message**: Detailed description of your issue
4. Click **Submit Ticket**.

### Viewing Tickets

- Your tickets are listed in the left panel with their status and priority.
- Click a ticket to view the full conversation thread.
- The thread shows all messages from both you and the admin, with timestamps and sender names.

### Replying to a Ticket

1. Open a ticket by clicking on it.
2. Type your reply in the text box at the bottom.
3. Click **Reply**.
4. All admins will be notified of your reply.

> You can reply to tickets that are Open or In Progress. Resolved/Closed tickets cannot receive new replies.

### Ticket Statuses

| Status      | Meaning                          |
| ----------- | -------------------------------- |
| Open        | Newly created, awaiting response |
| In Progress | Admin is working on it           |
| Resolved    | Issue has been fixed             |
| Closed      | Ticket is closed                 |

---

## 6. Notifications

You receive notifications for ticket-related activity:

- **Admin replied** to your ticket
- **Ticket resolved** — an admin marked your ticket as resolved
- **Ticket closed** — an admin closed your ticket

How to use:

- The **bell icon** in the top-right corner shows your unread notification count.
- Click the bell to see recent notifications.
- Click **Mark all as read** to clear the badge.
- Click a notification to navigate to the related ticket.

Notifications are checked automatically every 30 seconds.

---

## 7. Resetting Your Password

### When Logged In

Use the chat: ask the chatbot "I want to reset my password" and follow its instructions.

### When Locked Out (Not Logged In)

1. Click **Forgot password?** on the Login page.
2. Fill in:
   - **Email**
   - **Date of Birth**
   - **National ID**
   - **Security Code** (the code you saved during onboarding)
   - **New Password** + **Confirm New Password**
3. Click **Reset Password**.
4. On success, click **Sign In** to log in with your new password.

> If you have lost your security code, contact the university IT helpdesk.

---

## 8. Admin Guide

Admin users have access to a full management panel. Switch between Admin and User views using the link at the bottom of the sidebar.

### 8.1 Dashboard

The admin dashboard shows at a glance:

- **Total Users** — registered users count
- **Chat Sessions** — total conversations
- **Open Tickets** — tickets awaiting resolution
- **Total Messages** — messages processed
- **Recent Tickets** — latest tickets with user, status, and date

### 8.2 Knowledge Base

Manage top-level knowledge groupings.

1. Navigate to **Knowledge Base**.
2. Click **Add Knowledge Base** to create a new grouping.
3. Provide a **Name** and optional **Description**.
4. Toggle **Active** status.
5. Use the edit (pencil) and delete (trash) icons to manage existing entries.

### 8.3 Data Sources

This is where you configure external MySQL databases for the LLM to query via function calling and RAG.

#### Adding a Data Source

1. Navigate to **Data Sources**.
2. Click **Configure Source**.
3. Fill in the **database connection** details:
   - **Host**, **Port**, **Database Name**, **Username**, **Password**
4. Click **Crawl** to auto-detect all tables and columns in the database.
5. After crawling, **select the relevant tables** from the list — only selected tables will be available to the LLM (this keeps token usage efficient).
6. Provide a **Description** for each selected table explaining what it contains.
7. Click **Save Data Source**.

#### How It Works

Once configured, the LLM uses **RAG (Retrieval-Augmented Generation)** to query the database:

1. The LLM receives the schema of selected tables (columns, types, sample data).
2. When a user asks a data question, the LLM generates a **targeted SQL query** (e.g. `SELECT name, reg_number FROM studentmember WHERE name LIKE '%John%'`).
3. The backend validates the query is **read-only** (SELECT only — no INSERT, UPDATE, DELETE) and executes it.
4. Results are returned to the LLM, which formulates a natural-language response with source citations.

> **Important**: Only tables you explicitly select and describe will be sent to the LLM. This prevents token overflow when the database has many tables.

#### Sample Data

During crawling, the system collects **5 sample rows** per table. This helps the LLM understand the data format and generate accurate queries (e.g. knowing that names are stored as "SMITH John" vs "John Smith").

### 8.4 Ticket Management

Manage all user support tickets.

1. Navigate to **Tickets** (admin view).
2. Use the search bar to find specific tickets.
3. Click a ticket to view its full conversation thread (all user and admin replies).

#### Replying to a Ticket

1. Open a ticket.
2. Type your reply in the text box.
3. Click **Reply**.
4. The ticket status automatically changes to **In Progress** when you reply.
5. The ticket owner receives a notification about your reply.

#### Updating Ticket Status

Use the status dropdown to change between:

| Transition    | Effect                                               |
| ------------- | ---------------------------------------------------- |
| → In Progress | Signals that you are working on the issue            |
| → Resolved    | Marks the issue as fixed — the user is notified      |
| → Closed      | Closes the ticket permanently — the user is notified |

> When you resolve or close a ticket, the user automatically receives a notification.

### 8.5 User Management

View and manage all registered users.

1. Navigate to **Users**.
2. Search users by name or email.
3. View user details: name, email, role, onboarding status, last login.
4. **Change Role**: Use the dropdown in the Actions column to change a user's role (Student, Staff, or Admin).

### 8.6 Audit Log

The audit log provides full system observability by capturing **all Laravel log entries** (debug, info, warning, error, etc.) alongside application events.

1. Navigate to **Audit Log**.
2. Use the **Action filter** dropdown to view specific event types:
   - **Translations** — shows original language (Shona/Ndebele), original text, and translated text
   - **Function Calls** — LLM function executions
   - **Logins** — user login events
   - **Password Resets** — password change events
3. Use the **Level filter** dropdown to filter by log severity:
   - **Emergency / Alert / Critical** — system-level failures
   - **Error** — application errors (e.g. failed API calls, database errors)
   - **Warning** — potential issues
   - **Info** — informational messages
   - **Debug** — detailed debug output (LLM requests, query execution, etc.)
4. Each entry shows: **timestamp**, **level** (color-coded badge), **channel**, **user**, **action**, and **details**.

#### Expandable Context

Click any log row to expand it and view the **full context/debug JSON**, including:

- Exception stack traces (class, message, file, line, trace)
- LLM request/response metadata
- SQL queries and parameters
- Any additional context passed via `Log::error('message', ['key' => 'value'])`

#### Translation Auditing

When a user asks a question in Shona or Ndebele, the audit log records:

- The **original language** detected
- The **original text** in the native language
- The **English translation** used for processing

#### How It Works

All calls to Laravel's `Log` facade (`Log::debug()`, `Log::error()`, etc.) are automatically captured in the audit log via a custom Monolog channel. This runs alongside the standard file log (`storage/logs/laravel.log`), so nothing is lost. The audit log level threshold can be configured via the `AUDIT_LOG_LEVEL` environment variable (default: `debug`).

### 8.7 FAQ Analytics

View aggregated statistics about frequently asked questions.

- **Question**: the text of the question
- **Category**: topic category
- **Count**: how many times it was asked
- **Helpful**: helpful / not helpful ratings
- **Last Asked**: when it was last asked

Use this data to identify gaps in knowledge base coverage.

### 8.8 Settings

Configure system-wide settings (auto-saved on blur).

| Group    | Setting                  | Description                                        |
| -------- | ------------------------ | -------------------------------------------------- |
| General  | Application Name         | Display name of the app                            |
| General  | Welcome Message          | Message shown to new users                         |
| General  | Maintenance Mode         | Toggle to take the app offline                     |
| AI / LLM | OpenAI Model             | Which model to use (e.g. `gpt-4o`)                 |
| AI / LLM | Max Response Tokens      | Maximum tokens in LLM response                     |
| AI / LLM | Temperature              | Creativity level (0 = deterministic, 1 = creative) |
| AI / LLM | System Prompt            | Instructions given to the LLM                      |
| Chat     | Max Messages Per Session | Limit messages per conversation                    |
| Chat     | Session Timeout          | Auto-close sessions after N minutes                |

---

## 9. Demo Accounts

The following accounts are seeded for testing:

| Role    | Email             | Password      |
| ------- | ----------------- | ------------- |
| Admin   | admin@gsu.ac.zw   | `Admin@123`   |
| Student | student@gsu.ac.zw | `Student@123` |
| Staff   | staff@gsu.ac.zw   | `Staff@123`   |

> Security codes are randomly generated during seeding. Run `php artisan db:seed` to create these accounts.

---

## 10. FAQ

**Q: Can I use the chatbot in Shona or Ndebele?**
A: Yes! Type your question in Shona or Ndebele and the system will automatically detect and translate it. The response will be in English.

**Q: I lost my security code. How do I reset my password?**
A: Contact the university IT helpdesk. An admin can look up your account and assist with the reset.

**Q: Why can't I see the admin panel?**
A: Only users with the **admin** role can access the admin panel. Contact an existing admin to have your role changed.

**Q: How do I switch between admin and user views?**
A: Click the **Switch to User View** / **Switch to Admin** link at the bottom of the sidebar.

**Q: Can the chatbot access my student records?**
A: Only if an admin has configured the relevant data source. The chatbot generates targeted SQL queries to look up specific information — it does not have blanket access to all data.

**Q: Is my conversation private?**
A: Your chat history is tied to your account. Admins can view audit logs (translations, function calls, errors) but not your full chat messages.

**Q: How do I delete my chat history?**
A: You can delete individual chats by hovering over them in the sidebar and clicking the trash icon, or click **Clear All Chats** to delete all conversations at once.

**Q: How do I report a bug?**
A: Create a support ticket with the category **Technical** and describe the issue in detail.

**Q: What does the LLM have access to?**
A: The LLM can only query tables that an admin has explicitly selected and described in Data Sources. All queries are read-only (SELECT only). The LLM cannot modify, insert, or delete any data.
