"""Application configuration via environment variables."""

from pathlib import Path
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

# Monorepo root: apps/backend/app/core/config.py → 4 levels up
PROJECT_ROOT = Path(__file__).resolve().parents[4]
ROOT_ENV_FILE = PROJECT_ROOT / ".env"
BACKEND_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Load root .env first (where users configure DATABASE_URL), then local fallback
        env_file=(str(ROOT_ENV_FILE), str(BACKEND_ENV_FILE), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "RAG Platform"
    ENV: str = "development"
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_EXPIRE_MINUTES: int = 60
    MAX_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 15

    FRONTEND_URL: str = "http://localhost:3000"
    API_BASE_URL: str = "http://localhost:8000"
    CORS_ORIGINS: Annotated[list[str], NoDecode] = ["http://localhost:3000"]

    DATABASE_URL: str = "postgresql+asyncpg://rag_user:rag_password@localhost:5432/rag_platform"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Email (SMTP) — console fallback in development
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@rag-platform.local"
    SMTP_USE_TLS: bool = True

    # OAuth — Google
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_ENABLED: bool = False

    # OAuth — GitHub
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_ENABLED: bool = False

    # OAuth — Microsoft / Azure AD
    MICROSOFT_CLIENT_ID: str = ""
    MICROSOFT_CLIENT_SECRET: str = ""
    MICROSOFT_TENANT_ID: str = "common"
    MICROSOFT_ENABLED: bool = False

    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333

    OPENAI_API_KEY: str = ""
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSIONS: int = 1536

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def oauth_callback_base(self) -> str:
        return f"{self.API_BASE_URL}/api/v1/auth/oauth"

    def is_google_enabled(self) -> bool:
        return self.GOOGLE_ENABLED or bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET)

    def is_github_enabled(self) -> bool:
        return self.GITHUB_ENABLED or bool(self.GITHUB_CLIENT_ID and self.GITHUB_CLIENT_SECRET)

    def is_microsoft_enabled(self) -> bool:
        return self.MICROSOFT_ENABLED or bool(self.MICROSOFT_CLIENT_ID and self.MICROSOFT_CLIENT_SECRET)


settings = Settings()
