# Deployment Guide

This is a small standalone app with only two services: the SvelteKit app and a PostgreSQL database. No email, admin panel, or content seeding required.

---

## Option 1: Docker Compose (Recommended)

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
POSTGRES_USER=root
POSTGRES_PASSWORD=<a-strong-password>
POSTGRES_DB=openlingo_voice
JWT_ACCESS_SECRET=<openssl rand -base64 32>
JWT_REFRESH_SECRET=<openssl rand -base64 32>
ENCRYPTION_KEY=<openssl rand -hex 32>
OPENAI_API_KEY=sk-...
ORIGIN=https://your-domain.com
APP_PORT=2005
```

> The `ENCRYPTION_KEY` **must** stay the same across restarts — it decrypts stored user API keys. If you rotate it, all previously saved per-user keys become unreadable.

### 2. Start

```bash
docker compose -f compose.yaml up -d --build
```

This starts:

- `db` — PostgreSQL 17
- `app` — the SvelteKit Node server on the host port `APP_PORT` (default `2005`)

### 3. Apply the database schema (first time only)

```bash
docker compose -f compose.yaml run --rm migrate npm run db:push
```

### 4. Done

The app is live at `http://<server>:<APP_PORT>`. Register an account and start chatting.

---

## Option 2: Manual Docker

```bash
# Build
docker build -t open-lingo-voice .

# Run with a separate Postgres
docker run -p 3000:3000 \
  -e DATABASE_URL=postgres://... \
  -e JWT_ACCESS_SECRET=... \
  -e JWT_REFRESH_SECRET=... \
  -e ENCRYPTION_KEY=... \
  -e OPENAI_API_KEY=sk-... \
  -e ORIGIN=https://your-domain.com \
  open-lingo-voice
```

Then push the schema from a machine with Node:

```bash
DATABASE_URL=postgres://... npm run db:push
```

---

## Option 3: GitHub Actions CI/CD

A workflow is provided at `.github/workflows/deploy.yml`. It SSHes into your server, pulls the latest code, rebuilds, runs migrations, and restarts.

### Required repository secrets

| Secret           | Description                                |
| ---------------- | ------------------------------------------ |
| `DEPLOY_HOST`    | Server hostname/IP                         |
| `DEPLOY_USER`    | SSH user                                   |
| `DEPLOY_SSH_KEY` | Private SSH key                            |
| `DEPLOY_PORT`    | (optional) SSH port, default `22`          |
| `DEPLOY_PATH`    | Absolute path to the project on the server |

The server must have the repo cloned and a `.env` file in place. On push to `main` (or via manual run), the workflow runs:

```bash
git pull origin main
docker compose -f compose.yaml build
docker compose -f compose.yaml run --rm migrate npm run db:push
docker compose -f compose.yaml up -d
```

---

## Environment Variables Reference

| Variable             | Required    | Description                                      |
| -------------------- | ----------- | ------------------------------------------------ |
| `DATABASE_URL`       | ✅          | Postgres connection string                       |
| `JWT_ACCESS_SECRET`  | ✅          | Secret for signing access tokens (min 32 chars)  |
| `JWT_REFRESH_SECRET` | ✅          | Secret for signing refresh tokens (min 32 chars) |
| `ENCRYPTION_KEY`     | ✅          | 64-char hex key for encrypting user API keys     |
| `OPENAI_API_KEY`     | ✅*         | Global OpenAI key (or users set their own)       |
| `ORIGIN`             | recommended | Public URL; needed for secure cookies in prod    |

*Chat is disabled if no key is available. Either set `OPENAI_API_KEY` globally, or have each user add their own key in Settings.

---

## Operations

### View logs

```bash
docker compose -f compose.yaml logs -f app
```

### Database shell

```bash
docker compose -f compose.yaml exec db psql -U $POSTGRES_USER -d $POSTGRES_DB
```

### Restart

```bash
docker compose -f compose.yaml restart app
```

### Reset everything

```bash
docker compose -f compose.yaml down -v
docker compose -f compose.yaml up -d --build
docker compose -f compose.yaml run --rm migrate npm run db:push
```

---

## Notes

- **Voice mode requires HTTPS** in production because it uses `getUserMedia` for microphone access. Serve behind a reverse proxy (Caddy, nginx, Traefik) with TLS.
- The OpenAI Realtime API is billed per minute of audio — monitor usage if using the global key.
- Rate limits: 20 chat-completion requests/min and 5 realtime-token requests/min per user/IP.
