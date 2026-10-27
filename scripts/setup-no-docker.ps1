# RAG Platform — setup WITHOUT Docker (Windows)
# Run from project root:  .\scripts\setup-no-docker.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "=== RAG Platform — No-Docker Setup ===" -ForegroundColor Cyan
Write-Host ""

# 1. .env
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "[OK] Created .env from .env.example" -ForegroundColor Green
    Write-Host "     Edit .env and set DATABASE_URL to your PostgreSQL connection string."
} else {
    Write-Host "[OK] .env already exists" -ForegroundColor Green
}

# 2. Backend venv + deps
Write-Host ""
Write-Host "Setting up backend..." -ForegroundColor Cyan
Set-Location "$Root\apps\backend"

if (-not (Test-Path ".venv")) {
    python -m venv .venv
    Write-Host "[OK] Created Python virtual environment"
}

& .\.venv\Scripts\pip install -q -r requirements-auth.txt
& .\.venv\Scripts\pip install -q psycopg2-binary python-dotenv
Write-Host "[OK] Backend dependencies installed"

# 3. Migrations
Write-Host ""
Write-Host "Running database migrations..." -ForegroundColor Cyan
Set-Location $Root
& .\apps\backend\.venv\Scripts\python.exe .\scripts\run_migrations.py

# 4. Frontend
Write-Host ""
Write-Host "Setting up frontend..." -ForegroundColor Cyan
Set-Location "$Root\apps\frontend"
if (-not (Test-Path "node_modules")) {
    npm install
    Write-Host "[OK] Frontend dependencies installed"
} else {
    Write-Host "[OK] node_modules already present"
}

Set-Location $Root
Write-Host ""
Write-Host "=== Setup complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Start the app (two terminals):" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Terminal 1 — Backend:"
Write-Host "    cd apps\backend"
Write-Host "    .\.venv\Scripts\activate"
Write-Host "    uvicorn app.main:app --reload --port 8000"
Write-Host ""
Write-Host "  Terminal 2 — Frontend:"
Write-Host "    cd apps\frontend"
Write-Host "    npm run dev"
Write-Host ""
Write-Host "  Open: http://localhost:3000" -ForegroundColor Cyan
