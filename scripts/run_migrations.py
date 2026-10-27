#!/usr/bin/env python3
"""
Run PostgreSQL migrations without Docker or psql.

Usage (from project root):
    python scripts/run_migrations.py

Requires DATABASE_URL in .env (or environment).
Install: pip install psycopg2-binary python-dotenv
"""

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIGRATIONS_DIR = ROOT / "database" / "migrations"


def load_env() -> None:
    env_file = ROOT / ".env"
    if env_file.exists():
        try:
            from dotenv import load_dotenv
            load_dotenv(env_file)
        except ImportError:
            pass


def get_sync_url() -> str:
    url = os.getenv("DATABASE_URL", "")
    if not url:
        print("ERROR: DATABASE_URL is not set. Copy .env.example to .env and configure PostgreSQL.")
        sys.exit(1)
    return url.replace("postgresql+asyncpg://", "postgresql://").replace("postgresql+psycopg2://", "postgresql://")


def main() -> None:
    load_env()
    sync_url = get_sync_url()

    try:
        import psycopg2
    except ImportError:
        print("ERROR: Install psycopg2-binary: pip install psycopg2-binary python-dotenv")
        sys.exit(1)

    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not migration_files:
        print("No migration files found.")
        sys.exit(1)

    print(f"Connecting to database...")
    conn = psycopg2.connect(sync_url)
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            filename VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    for path in migration_files:
        cur.execute("SELECT 1 FROM schema_migrations WHERE filename = %s", (path.name,))
        if cur.fetchone():
            print(f"  SKIP  {path.name} (already applied)")
            continue

        print(f"  RUN   {path.name}")
        sql = path.read_text(encoding="utf-8")
        cur.execute(sql)
        cur.execute("INSERT INTO schema_migrations (filename) VALUES (%s)", (path.name,))

    cur.close()
    conn.close()
    print("\nMigrations complete.")


if __name__ == "__main__":
    main()
