# Local Setup Without Docker

Docker is **not required**. For Phase 0 (authentication), you only need:

| Service | Required? | Alternative |
|---------|-----------|-------------|
| **PostgreSQL** | Yes | Local install OR free cloud (Neon, Supabase) |
| Redis | No | Needed later for ingestion workers |
| Qdrant | No | Needed later for vector search |
| MinIO | No | Needed later for file storage |

---

## Option A — Cloud PostgreSQL (easiest, no local DB install)

Best if your org blocks Docker and you cannot install PostgreSQL locally.

### 1. Create a free database

Use one of these (all offer free tiers):

- [Neon](https://neon.tech) — recommended, serverless Postgres
- [Supabase](https://supabase.com)
- [ElephantSQL](https://www.elephantsql.com)

Create a project/database and copy the **connection string**.

### 2. Configure `.env`

```env
# Neon example (add sslmode for cloud providers)
DATABASE_URL=postgresql+asyncpg://user:password@ep-xxx.region.aws.neon.tech/rag_platform?ssl=require
```

For **asyncpg** with Neon, use `ssl=require` in the query string.

### 3. Run setup

```powershell
cd c:\Learning\RAG\RAG_Application
copy .env.example .env
# Edit .env — paste your DATABASE_URL

.\scripts\setup-no-docker.ps1
```

---

## Option B — PostgreSQL installed on Windows

### 1. Install PostgreSQL

1. Download from https://www.postgresql.org/download/windows/
2. Run the installer (default port `5432`)
3. Remember the **postgres superuser password** you set

### 2. Create database and user

Open **pgAdmin** or **SQL Shell (psql)** and run:

```sql
CREATE USER rag_user WITH PASSWORD 'rag_password';
CREATE DATABASE rag_platform OWNER rag_user;
GRANT ALL PRIVILEGES ON DATABASE rag_platform TO rag_user;
```

### 3. Configure `.env`

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=rag_user
POSTGRES_PASSWORD=rag_password
POSTGRES_DB=rag_platform
DATABASE_URL=postgresql+asyncpg://rag_user:rag_password@localhost:5432/rag_platform
```

### 4. Run setup

```powershell
.\scripts\setup-no-docker.ps1
```

---

## Run migrations manually

If you only need to (re)run migrations:

```powershell
cd c:\Learning\RAG\RAG_Application
.\apps\backend\.venv\Scripts\pip install psycopg2-binary python-dotenv
.\apps\backend\.venv\Scripts\python.exe .\scripts\run_migrations.py
```

No `psql` or Docker needed — the script uses `DATABASE_URL` from `.env`.

---

## Start the application

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

Open **http://localhost:3000**

---

## Verify everything works

| Component | How to check |
|-----------|--------------|
| **Database** | Migrations script prints `Migrations complete.` |
| **Backend** | http://localhost:8000/health → `{"status":"ok"}` |
| **API docs** | http://localhost:8000/docs |
| **Frontend** | http://localhost:3000 → login page |
| **Auth** | Register → redirects to `/home` |
| **WebSocket** | Header shows **Live** after login |

---

## Troubleshooting

### `connection refused` to PostgreSQL

- Local: ensure PostgreSQL Windows service is running (`services.msc` → `postgresql-x64-*`)
- Cloud: check connection string, firewall, and `ssl=require` for Neon

### `password authentication failed`

- Verify `DATABASE_URL` username/password match what you created

### `relation "users" does not exist`

- Run: `python scripts/run_migrations.py`

### Backend starts but register fails

- Check backend terminal for the actual error
- Confirm migrations ran successfully

---

## When you need Redis / Qdrant / MinIO later

Those features (ingestion, vectors, file upload) can use:

- **Redis**: Memurai (Windows Redis-compatible) or cloud Redis
- **Qdrant**: Qdrant Cloud free tier
- **MinIO**: Not required — use AWS S3 or Azure Blob in production

For now, **auth and the home page work with PostgreSQL only**.
