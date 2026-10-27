"""Authentication endpoints: login, register, OAuth, password reset."""

from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.integrations.oauth import get_enabled_providers, oauth, resolve_provider
from app.models.user import AuthProvider, User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    OAuthProvidersResponse,
    OAuthProviderInfo,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import auth_service

router = APIRouter()


@router.get("/providers", response_model=OAuthProvidersResponse)
async def list_oauth_providers() -> OAuthProvidersResponse:
    """List available OAuth login methods."""
    providers = [OAuthProviderInfo(**p) for p in get_enabled_providers()]
    return OAuthProvidersResponse(providers=providers)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Create a new account with email and password."""
    result = await auth_service.register(db, data)
    await db.commit()
    return result


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, data: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Authenticate with email and password."""
    result = await auth_service.login(
        db,
        data,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()
    return result


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Exchange a refresh token for a new access/refresh token pair."""
    result = await auth_service.refresh(db, data.refresh_token)
    await db.commit()
    return result


@router.post("/logout", response_model=MessageResponse)
async def logout(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    """Revoke a refresh token (logout)."""
    await auth_service.logout(db, data.refresh_token)
    await db.commit()
    return MessageResponse(message="Logged out successfully")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    """Send password reset email. Always returns success to prevent email enumeration."""
    await auth_service.forgot_password(db, data.email)
    await db.commit()
    return MessageResponse(
        message="If an account exists with that email, a password reset link has been sent."
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    """Reset password using token from email."""
    await auth_service.reset_password(db, data.token, data.new_password)
    await db.commit()
    return MessageResponse(message="Password has been reset successfully. You can now sign in.")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Get the currently authenticated user."""
    return UserResponse.model_validate(current_user)


@router.get("/oauth/{provider}")
async def oauth_login(provider: str, request: Request):
    """Redirect to OAuth provider authorization page."""
    try:
        client_name = resolve_provider(provider)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    redirect_uri = f"{settings.oauth_callback_base}/{provider}/callback"
    return await oauth.create_client(client_name).authorize_redirect(request, redirect_uri)


@router.get("/oauth/{provider}/callback")
async def oauth_callback(provider: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Handle OAuth callback and issue JWT tokens."""
    try:
        client_name = resolve_provider(provider)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    client = oauth.create_client(client_name)
    token = await client.authorize_access_token(request)

    email: str | None = None
    full_name: str | None = None
    avatar_url: str | None = None
    provider_account_id: str | None = None

    if provider == "google":
        userinfo = token.get("userinfo") or await client.parse_id_token(request, token)
        email = userinfo.get("email")
        full_name = userinfo.get("name")
        avatar_url = userinfo.get("picture")
        provider_account_id = userinfo.get("sub")
    elif provider == "github":
        resp = await client.get("user", token=token)
        profile = resp.json()
        provider_account_id = str(profile["id"])
        full_name = profile.get("name") or profile.get("login")
        avatar_url = profile.get("avatar_url")
        email_resp = await client.get("user/emails", token=token)
        emails = email_resp.json()
        primary = next((e for e in emails if e.get("primary")), emails[0] if emails else None)
        email = primary["email"] if primary else None
    elif provider == "microsoft":
        userinfo = token.get("userinfo") or await client.parse_id_token(request, token)
        email = userinfo.get("email") or userinfo.get("preferred_username")
        full_name = userinfo.get("name")
        provider_account_id = userinfo.get("sub")

    if not email or not provider_account_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not retrieve email from provider")

    auth_provider = AuthProvider(provider)
    result = await auth_service.oauth_login_or_register(
        db,
        provider=auth_provider,
        provider_account_id=provider_account_id,
        email=email,
        full_name=full_name,
        avatar_url=avatar_url,
        access_token=token.get("access_token"),
        refresh_token=token.get("refresh_token"),
    )
    await db.commit()

    params = urlencode(
        {
            "access_token": result.access_token,
            "refresh_token": result.refresh_token,
            "expires_in": str(result.expires_in),
        }
    )
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/auth/oauth/callback?{params}")
