# RAG Platform — Execution & Configuration Guide

Complete procedure to install, configure, run, and verify the application locally. Use this with [WITHOUT_DOCKER.md](./WITHOUT_DOCKER.md) and [Auth Setup](../auth/SETUP.md).

---

## 1. What you are running

| Process | Port | Role |
|--------|------|------|
| **PostgreSQL** | 5432 | Users, auth, pipelines, RAG components (**required**) |
| **FastAPI backend** | 8000 | REST API, OAuth callbacks, WebSocket |
| **Next.js frontend** | 3000 | UI + BFF API routes (`/api/auth/*`, `/api/rag/*`) |
| **Redis** | 6379 | Optional now; planned for Celery/workers |
| **Qdrant** | 6333 | Optional now; vector search when RAG runtime uses it |
| **MinIO** | 9000 / 9001 | Optional; uploads today use **local disk** (`data/uploads/`) |

### Request flow (auth)

```text
Browser → localhost:3000 (Next.js)
       → /api/auth/login (Next route)
       → localhost:8000/api/v1/auth/login (FastAPI)
       → Sets httpOnly cookies → /home
```

### Request flow (RAG API)

```text
Browser → /api/rag/... (Next proxy)
       → NEXT_PUBLIC_API_URL (default http://localhost:8000/api/v1)
       → FastAPI /api/v1/rag/...
```

---

## 2. Prerequisites

| Tool | Version | Check |
|------|---------|--------|
| **Node.js** | 20+ | `node -v` |
| **npm** | comes with Node | `npm -v` |
| **Python** | 3.11+ | `python --version` |
| **PostgreSQL** | 14+ (or Neon/Supabase) | connection string ready |
| **Docker** | optional | only if you use `docker compose` |
| **Git** | any | clone repo |

---

## 3. Configuration tiers (what to enable when)

| Tier | Goal | Services | Backend deps |
|------|------|----------|----------------|
| **Tier 0 — Auth + UI** | Login, register, home, WebSocket “Live” | PostgreSQL only | `requirements-auth.txt` (setup script) |
| **Tier 1 — RAG metadata** | Pipelines, components, designer, uploads to disk | PostgreSQL | `requirements.txt` |
| **Tier 2 — Full RAG runtime** | Embeddings, vectors, async ingest | + Qdrant, Redis, `OPENAI_API_KEY` | `requirements.txt` + infra |
| **Tier 3 — Production-like** | S3, SMTP, OAuth, HTTPS cookies | + MinIO/S3, SMTP, OAuth apps | all env vars |

Start at **Tier 0**, verify, then move up.

---

## 4. One-time setup (Windows, no Docker)

### Step 1 — Project root

```powershell
cd c:\Learning\RAG\RAG_Application
```

### Step 2 — Create and edit `.env`

```powershell
copy .env.example .env
```

**Minimum for Tier 0:**

| Variable | What to set |
|----------|-------------|
| `DATABASE_URL` | Your Postgres URL (see below) |
| `SECRET_KEY` | Long random string (backend JWT/sessions) |
| `NEXTAUTH_SECRET` | Long random string |
| `FRONTEND_URL` | `http://localhost:3000` |
| `API_BASE_URL` | `http://localhost:8000` |
| `CORS_ORIGINS` | `http://localhost:3000` |

**Local Postgres example:**

```env
DATABASE_URL=postgresql+asyncpg://rag_user:rag_password@localhost:5432/rag_platform
```

**Neon / cloud example:**

```env
DATABASE_URL=postgresql+asyncpg://USER:PASS@ep-xxx.region.aws.neon.tech/rag_platform?ssl=require
```

Create DB/user locally (pgAdmin or `psql`):

```sql
CREATE USER rag_user WITH PASSWORD 'rag_password';
CREATE DATABASE rag_platform OWNER rag_user;
GRANT ALL PRIVILEGES ON DATABASE rag_platform TO rag_user;
```

### Step 3 — Automated setup

```powershell
.\scripts\setup-no-docker.ps1
```

This script:

1. Ensures `.env` exists
2. Creates `apps\backend\.venv`
3. Installs **auth-minimal** deps (`requirements-auth.txt`) + migration tools
4. Runs **all** SQL migrations in `database/migrations/` (001 → 004)
5. Runs `npm install` in `apps\frontend` if needed

Expect: `Migrations complete.` and `=== Setup complete ===`.

### Step 4 — (Optional) Full backend for RAG/ML

When you need LangChain, Qdrant client, document parsers:

```powershell
cd c:\Learning\RAG\RAG_Application\apps\backend
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### Step 5 — Frontend env (only if you change API URL)

Backend reads **repo root** `.env`. Next.js reads **`apps/frontend/.env.local`**.

Defaults work for local dev (`NEXT_PUBLIC_API_URL` falls back to `http://localhost:8000/api/v1`). If you customize, create **`apps/frontend/.env.local`:**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<same-or-separate-secret>
```

Restart `npm run dev` after changing `NEXT_PUBLIC_*`.

---

## 5. One-time setup (Docker for infrastructure)

```powershell
cd c:\Learning\RAG\RAG_Application
copy .env.example .env
```

Align `.env` with `docker-compose.yml` defaults:

```env
POSTGRES_USER=rag_user
POSTGRES_PASSWORD=rag_password
POSTGRES_DB=rag_platform
DATABASE_URL=postgresql+asyncpg://rag_user:rag_password@localhost:5432/rag_platform
```

**Auth only:**

```powershell
docker compose up -d postgres
.\scripts\setup-no-docker.ps1
```

**Full local stack (Postgres + Redis + Qdrant + MinIO):**

```powershell
docker compose up -d
.\scripts\setup-no-docker.ps1
```

Then set `REDIS_URL`, `QDRANT_HOST`/`QDRANT_PORT`, and S3/MinIO vars to match compose defaults in `.env`.

Verify containers:

```powershell
docker compose ps
```

---

## 6. Daily execution procedure

Use **two terminals**.

### Terminal 1 — Backend

```powershell
cd c:\Learning\RAG\RAG_Application\apps\backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 — Frontend

```powershell
cd c:\Learning\RAG\RAG_Application\apps\frontend
npm run dev
```

Open **http://localhost:3000**

### Stop

- `Ctrl+C` in each terminal
- Docker: `docker compose stop` (or `down`; volumes keep data)

---

## 7. Verification checklist

| # | Check | Expected |
|---|--------|----------|
| 1 | http://localhost:8000/health | `{"status":"ok"}` |
| 2 | http://localhost:8000/docs | Swagger UI loads |
| 3 | http://localhost:3000 | Redirects to `/login` or `/home` |
| 4 | Register new user | Lands on `/home` |
| 5 | Header WebSocket | **Live** after login |
| 6 | Logout / login | Session cookies work |
| 7 | Forgot password | With empty `SMTP_HOST`, link in **backend console** |

---

## 8. `.env` reference

### App & URLs

| Variable | Purpose |
|----------|---------|
| `FRONTEND_URL` | Password-reset links, OAuth redirects to UI |
| `API_BASE_URL` | OAuth callback base on backend |
| `CORS_ORIGINS` | Must include frontend origin (comma-separated if multiple) |
| `NEXT_PUBLIC_API_URL` | Frontend → backend |

Use `localhost` consistently, or add `http://127.0.0.1:3000` to `CORS_ORIGINS` if you browse via 127.0.0.1.

### Security

| Variable | Notes |
|----------|--------|
| `SECRET_KEY` | Backend: JWT, session middleware |
| `ENV=production` | Enables secure cookies on frontend |
| Password policy | min 8 chars, upper, lower, number |

### Email (password reset)

Leave `SMTP_HOST` empty in dev — reset URLs print in the backend log. See `.env.example` for SMTP fields.

### OAuth (optional)

| Provider | Redirect URI (local) |
|----------|----------------------|
| Google | `http://localhost:8000/api/v1/auth/oauth/google/callback` |
| GitHub | `http://localhost:8000/api/v1/auth/oauth/github/callback` |
| Microsoft | `http://localhost:8000/api/v1/auth/oauth/microsoft/callback` |

Details: [Auth Setup](../auth/SETUP.md).

### PostgreSQL (required)

`DATABASE_URL` must use `postgresql+asyncpg://` for the app.

Re-run migrations:

```powershell
cd c:\Learning\RAG\RAG_Application
.\apps\backend\.venv\Scripts\python.exe .\scripts\run_migrations.py
```

Migrations (tracked in `schema_migrations`):

- `001_initial_schema.sql`
- `002_auth_extensions.sql`
- `003_rag_pipelines.sql`
- `004_rag_components.sql`

### Redis / Celery (Tier 2+)

```env
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

### Qdrant (Tier 2+)

```env
QDRANT_HOST=localhost
QDRANT_PORT=6333
```

### LLM / embeddings (Tier 2+)

```env
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
```

Azure OpenAI variables are in `.env.example`.

---

## 9. Application map (after login)

| UI area | Route (approx.) | Backend prefix |
|---------|-----------------|----------------|
| Home | `/home` | — |
| Projects | `/projects` | `/api/v1/projects` |
| RAG catalog | `/rag` | `/api/v1/rag` |
| Pipelines | `/rag/pipelines` | `/api/v1/pipelines` |
| Components | RAG flows | `/api/v1/rag/components` |
| Designer | `/projects/[id]/designer` | pipelines + graph |
| Playground | `/playground` | `/api/v1/playground` |
| Evaluation | `/evaluation` | `/api/v1/evaluation` |
| Knowledge | `/knowledge` | `/api/v1/knowledge` |

**WebSocket:** `ws://localhost:8000/api/v1/ws/session` — see [Auth Setup](../auth/SETUP.md).

File uploads (data ingestion) are stored under `data/uploads/` at repo root.

---

## 10. Suggested configuration order

1. PostgreSQL + `DATABASE_URL` + `SECRET_KEY`
2. Run `setup-no-docker.ps1`
3. Start backend + frontend → register → confirm WebSocket **Live**
4. SMTP or console reset links
5. `pip install -r requirements.txt` for full RAG stack
6. `docker compose up -d qdrant redis` + `OPENAI_API_KEY` for embeddings/playground
7. OAuth (provider consoles)

---

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| `DATABASE_URL is not set` | No root `.env` | Copy `.env.example` → `.env` |
| `connection refused` (DB) | Postgres down / wrong host | Start service or Docker postgres |
| `password authentication failed` | Wrong user/pass in URL | Match DB user |
| `relation "users" does not exist` | Migrations not run | `run_migrations.py` |
| CORS error | Origin mismatch | `CORS_ORIGINS=http://localhost:3000` |
| Frontend can’t reach API | Wrong `NEXT_PUBLIC_API_URL` | `apps/frontend/.env.local` + restart dev |
| Login loop | Stale cookies | Clear site cookies for localhost |
| Port 5432 in use | Local Postgres + Docker | Stop one or change compose port |

**Env load order (backend):** monorepo root `.env` → `apps/backend/.env` → cwd `.env`. Prefer a **single root `.env`**.

---

## 12. Production checklist

- Strong `SECRET_KEY` and `NEXTAUTH_SECRET`
- `ENV=production`, HTTPS, correct `CORS_ORIGINS`
- `FRONTEND_URL` / `API_BASE_URL` = public URLs
- SMTP for password reset
- Managed Postgres with SSL
- Never commit `.env` (see root `.gitignore`)

---

## 13. Quick reference

```powershell
# ONE-TIME
cd c:\Learning\RAG\RAG_Application
copy .env.example .env
# edit DATABASE_URL, SECRET_KEY
.\scripts\setup-no-docker.ps1

# OPTIONAL FULL BACKEND
cd apps\backend
.\.venv\Scripts\activate
pip install -r requirements.txt

# EVERY DAY — Terminal 1
cd apps\backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# EVERY DAY — Terminal 2
cd apps\frontend
npm run dev

# MIGRATIONS
.\apps\backend\.venv\Scripts\python.exe .\scripts\run_migrations.py

# DOCKER INFRA
docker compose up -d postgres
```

---

## Related docs

| Doc | Description |
|-----|-------------|
| [WITHOUT_DOCKER.md](./WITHOUT_DOCKER.md) | Postgres options (cloud vs local) |
| [SETUP.md](../auth/SETUP.md) | Auth, OAuth, WebSocket |
| [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) | System design |
| [README.md](../../README.md) | Repo overview |
