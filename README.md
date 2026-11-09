# Unified Event Analytics Engine

A backend API for collecting and analysing website / mobile-app events (clicks, visits, referrers, device info). 
Apps register through Google sign-in, receive an API key, and send events with that key. Owners then query aggregated analytics.

**Stack:** Node.js, Express, TypeScript, PostgreSQL, Prisma (ORM), Redis, Zod, Swagger UI, Docker

---

## Features

- **Google OAuth onboarding** (Passport.js). Sessions are stored in PostgreSQL.
- **API key management:** create (on app registration), fetch, revoke. Keys expire after 30 days.
- **Event ingestion** authenticated with an `x-api-key` header.
- **Analytics:** event summary (count, unique users, device split) and per-user stats.
- **Redis caching** of analytics responses (short TTL).
- **Redis-backed rate limiting** on auth, collect and analytics routes.
- **Swagger docs** at `/api-docs` (raw JSON at `/api-docs.json`).

---

## Data Model
<img width="1255" height="747" alt="image" src="https://github.com/user-attachments/assets/ec00fd01-946c-45f4-882c-44c467100bf4" />

---

## Architecture Decisions

- **API key storage:** keys are generated randomly (32 bytes). Each key is stored two ways: a **SHA-256 hash** for fast, indexed lookup on every request, and an **AES-GCM encrypted copy** (`encrypted_key`, `iv`, `auth_tag`) so the owner can retrieve it later.
- **Two auth mechanisms:** session cookie (Google) for owner-facing endpoints; `x-api-key` header for event ingestion.
- **Tenant isolation:** every analytics query is scoped to apps owned by the logged-in user.
- **Caching:** analytics responses are cached in Redis, keyed by user + filters (60s for event summary, 30s for user stats).
- **Rate limiting:** `express-rate-limit` with a Redis store, so limits are shared across instances.
- **Validation:** all request bodies/queries are validated with Zod.

---
## API Overview

### Auth & API keys (session cookie required unless noted)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/google` | Start Google login |
| GET | `/api/auth/google/callback` | OAuth callback, sets session |
| GET | `/api/auth/me` | Current user |
| DELETE | `/api/auth/logout` | Log out |
| POST | `/api/auth/register` | Register an app and get its API key |
| GET | `/api/auth/api-key?app_id=` | Get active API keys for an app |
| POST | `/api/auth/revoke` | Revoke a key (`app_id`, `key_id`) |

### Events

**`POST /api/analytics/collect`** (header `x-api-key: <key>`)

```json
{
  "event": "login_form_cta_click",
  "url": "https://example.com/page",
  "referrer": "https://google.com",
  "device": "mobile",
  "ipAddress": "203.0.113.5",
  "timestamp": "2024-02-20T12:34:56Z",
  "userId": "user789",
  "metadata": { "browser": "Chrome", "os": "Android", "screenSize": "1080x1920" }
}
```

Returns `204 No Content`.

### Analytics (session cookie required)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/analytics/event-summary` | Body: `event`, optional `startDate`, `endDate`, `app_id`. Returns count, unique users, device breakdown. |
| GET | `/api/analytics/user-stats?userId=` | Total events, IPs, browsers and OS for an end user. |

### Rate limits

| Route group | Limit |
|---|---|
| Auth (login) | 10 / 15 min |
| Register / API-key routes | 20 / 15 min |
| `collect` | 300 / min |
| `event-summary`, `user-stats` | 60 / min each |

---
## Getting Started

### 1. Clone and configure

```bash
git clone https://github.com/codewkaushik404/unified-event-analytics-engine.git
cd unified-event-analytics-engine
cp .env.example .env
```

### 2. Start the app

**Option A: Docker (recommended)**

```bash
docker compose up --build
```

This starts PostgreSQL, Redis, runs migrations, and launches the API.

**Option B: Locally** (needs Node 22+, PostgreSQL and Redis running)

```bash
npm install
npx prisma migrate deploy
npx prisma generate

npm run dev OR npm run start
```

### 3. Try it out

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/api-docs`
