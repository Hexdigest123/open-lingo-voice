# OpenLingo Voice

A standalone **voice and text chat** app for practicing Spanish with AI, extracted from the full OpenLingo language-learning platform. Powered by OpenAI's Realtime API and Chat Completions.

This is a focused, independently-deployable app — no lessons, gamification, admin panel, or email required. Just sign up, configure an OpenAI API key, and start practicing.

## Features

- **Text Chat** — Ask questions, get translations, and practice writing in Spanish with GPT-5.4-mini.
- **Real-time Voice** — Have natural spoken conversations with an AI Spanish tutor using the OpenAI Realtime API (WebRTC).
- **Conversation History** — All sessions and messages are saved to PostgreSQL.
- **Per-user or Global API Key** — Use a single server-side `OPENAI_API_KEY`, or let each user bring their own key (stored encrypted with AES-256-GCM).
- **Multi-language UI** — English and German interface.
- **Rate Limiting** — Built-in protection for AI endpoints.

## Tech Stack

- **Frontend**: SvelteKit, Svelte 5, TypeScript, Tailwind CSS v4
- **Backend**: SvelteKit (Node adapter), Drizzle ORM
- **Database**: PostgreSQL 17
- **Auth**: JWT access tokens + refresh tokens (httpOnly cookies), bcrypt password hashing
- **AI**: OpenAI API (GPT-5.4-mini chat, GPT-Realtime-2.1-mini voice)

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- An OpenAI API key with access to GPT-5.4-mini and the Realtime API

## Quick Start

1. **Clone and install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Generate secrets:

   ```bash
   openssl rand -base64 32  # for JWT_ACCESS_SECRET and JWT_REFRESH_SECRET
   openssl rand -hex 32     # for ENCRYPTION_KEY
   ```

   Set your OpenAI key:

   ```env
   OPENAI_API_KEY=sk-...
   ```

3. **Start the database**

   ```bash
   npm run db:start
   ```

4. **Apply the database schema**

   ```bash
   npm run db:push
   ```

5. **Start the dev server**

   ```bash
   npm run dev
   ```

6. **Open the app** at `http://localhost:5173`, register, and start chatting.

## Available Scripts

```bash
npm run dev          # Start dev server with HMR
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # TypeScript + Svelte type checking
npm run lint         # ESLint + Prettier check
npm run format       # Auto-format with Prettier
npm run db:start     # Start PostgreSQL container
npm run db:push      # Apply schema to database
npm run db:generate  # Generate migration files
npm run db:studio    # Open Drizzle Studio GUI
```

## API Key Strategy

Chat features need an OpenAI API key. The app resolves the key in this order:

1. **User's personal key** — Set in Settings → API Key (encrypted in the DB). Takes priority.
2. **Global key** — The `OPENAI_API_KEY` environment variable. Used as a fallback.

If neither is available, the chat shows an "API Key Required" prompt.

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── chat/           # Chat UI (ChatInput, ChatMessage, ModeToggle, VoiceRecorder)
│   │   └── ui/             # Toast notifications
│   ├── i18n/               # Internationalization (en.json, de.json)
│   └── server/
│       ├── auth/           # JWT, password hashing, encryption
│       ├── db/             # Drizzle schema and connection
│       ├── openai/         # API key resolution
│       ├── security/       # Rate limiting
│       └── audit/          # API usage logging
├── routes/
│   ├── (public)/           # Landing, login, register
│   ├── (protected)/        # Chat, settings
│   └── api/                # Chat completions, realtime token, sessions, auth
└── hooks.server.ts         # Auth + rate limiting middleware
```

## Database Schema

This app uses a small subset of tables:

- `users` — Accounts (email, password hash, display name, optional encrypted API key, locale)
- `refresh_tokens` — Session refresh tokens
- `chat_sessions` — Conversation sessions (text/voice mode)
- `chat_messages` — Messages within sessions (user/assistant/system)
- `api_usage_logs` — Auditing for global-key usage

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full Docker and CI/CD instructions.

The fastest path is `docker compose -f compose.yaml up -d` after filling in `.env`.

## Security

- Passwords hashed with bcrypt
- Per-user API keys encrypted with AES-256-GCM before storage
- JWT access tokens (15-min expiry) + refresh tokens (7-day, httpOnly cookies, rotation)
- Rate limiting on AI endpoints
- Input validation with Zod and ASCII-only input checks
- Open redirect protection on login

## License

Private project.
