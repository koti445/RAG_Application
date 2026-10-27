# RAG Platform

Enterprise-grade platform to **design**, **configure**, **ingest**, **run**, and **evaluate** RAG pipelines with a visual workflow designer and A/B playground.

## Monorepo Structure

```
RAG_Application/
├── apps/
│   ├── frontend/          # Next.js — UI, designer, playground
│   └── backend/           # FastAPI — APIs, RAG runtime, workers
├── packages/
│   └── shared-types/      # Shared TypeScript types (API contracts)
├── database/
│   ├── migrations/        # PostgreSQL schema migrations
│   └── seeds/             # Dev seed data
├── infrastructure/
│   ├── docker/            # Dockerfiles
│   └── terraform/         # Cloud IaC (optional)
├── docs/
│   ├── architecture/      # Architecture & workflows
│   └── database/          # Schema documentation
└── scripts/               # Dev & CI helper scripts
```

## Phase 0 — Authentication (implemented)

- Email **sign up** and **sign in** with JWT + refresh tokens
- **Forgot password** / **reset password** flow (SMTP or console in dev)
- **OAuth**: Google, GitHub, Microsoft (when credentials are configured)
- Enterprise security: password policy, account lockout, httpOnly cookies
- See [Auth Setup Guide](docs/auth/SETUP.md)

## Quick Start (Local — No Docker)

**Docker is optional.** For auth (Phase 0), you only need **PostgreSQL** + Python + Node.js.

### Prerequisites

- **PostgreSQL** — [install locally](https://www.postgresql.org/download/windows/) OR use free [Neon](https://neon.tech) cloud
- Node.js 20+
- Python 3.11+

### One-command setup (Windows)

```powershell
cd c:\Learning\RAG\RAG_Application
copy .env.example .env
# Edit .env — set DATABASE_URL (see docs/setup/WITHOUT_DOCKER.md)

.\scripts\setup-no-docker.ps1
```

### Start the app

**Terminal 1 — Backend:**

```powershell
cd apps\backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**

```powershell
cd apps\frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Verify

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend health | http://localhost:8000/health |
| API docs | http://localhost:8000/docs |

Full guides:

- **[Execution & Configuration Guide](docs/setup/EXECUTION_GUIDE.md)** — step-by-step setup, `.env`, daily run, verification
- **[Setup Without Docker](docs/setup/WITHOUT_DOCKER.md)** — PostgreSQL options (cloud vs local)

---

## Quick Start (With Docker — optional)

If Docker is available, you can run Postgres/Redis/Qdrant/MinIO via Compose:

```bash
docker compose up -d postgres   # auth only needs postgres
python scripts/run_migrations.py
```

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](docs/architecture/ARCHITECTURE.md) | System design, stack, phases |
| [Workflows](docs/architecture/WORKFLOW.md) | Sequence diagrams, routes |
| [Database](docs/database/DATABASE.md) | Schema overview |

## Key Features

- **Auth** — Login, JWT, workspace RBAC
- **Visual Designer** — React Flow canvas (draw.io-style RAG builder)
- **RAG Tabs** — Knowledge base, embeddings, retrieval, memory, generation
- **Playground** — Live chat with retrieval traces
- **A/B Testing** — Compare two pipeline configs side-by-side
- **Evaluation** — Batch runs with datasets and metrics

## License

Private / your choice.
