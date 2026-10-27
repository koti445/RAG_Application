"""OAuth provider configuration using Authlib."""

from authlib.integrations.starlette_client import OAuth

from app.core.config import settings

oauth = OAuth()

if settings.is_google_enabled():
    oauth.register(
        name="google",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )

if settings.is_github_enabled():
    oauth.register(
        name="github",
        client_id=settings.GITHUB_CLIENT_ID,
        client_secret=settings.GITHUB_CLIENT_SECRET,
        access_token_url="https://github.com/login/oauth/access_token",
        authorize_url="https://github.com/login/oauth/authorize",
        api_base_url="https://api.github.com/",
        client_kwargs={"scope": "user:email"},
    )

if settings.is_microsoft_enabled():
    tenant = settings.MICROSOFT_TENANT_ID
    oauth.register(
        name="microsoft",
        client_id=settings.MICROSOFT_CLIENT_ID,
        client_secret=settings.MICROSOFT_CLIENT_SECRET,
        server_metadata_url=f"https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


def get_enabled_providers() -> list[dict[str, str | bool]]:
    labels = {"google": "Google", "github": "GitHub", "microsoft": "Microsoft"}
    checks = {
        "google": settings.is_google_enabled(),
        "github": settings.is_github_enabled(),
        "microsoft": settings.is_microsoft_enabled(),
    }
    return [{"id": key, "name": labels[key], "enabled": checks[key]} for key in labels]


def resolve_provider(provider: str) -> str:
    checks = {
        "google": settings.is_google_enabled(),
        "github": settings.is_github_enabled(),
        "microsoft": settings.is_microsoft_enabled(),
    }
    if provider not in checks or not checks[provider]:
        raise ValueError(f"OAuth provider '{provider}' is not enabled")
    return provider
