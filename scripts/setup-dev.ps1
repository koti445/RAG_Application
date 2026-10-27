# Windows dev setup script for RAG Platform

Write-Host "Starting infrastructure (Postgres, Redis, Qdrant, MinIO)..."
docker compose up -d

Write-Host "Copy .env if missing..."
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env — please add your API keys."
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Backend:  cd apps/backend && python -m venv .venv && .\.venv\Scripts\activate && pip install -r requirements.txt"
Write-Host "  2. DB:       psql or run database/migrations/001_initial_schema.sql"
Write-Host "  3. API:      uvicorn app.main:app --reload"
Write-Host "  4. Frontend: cd apps/frontend && npx create-next-app@latest . --typescript --tailwind --app --src-dir"
