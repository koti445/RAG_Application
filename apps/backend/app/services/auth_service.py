"""Authentication business logic."""

import re
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token_value,
    generate_reset_token,
    hash_password,
    hash_token,
    validate_password_strength,
    verify_password,
)
from app.models.user import AuthProvider, Organization, OrganizationMember, MemberRole, OAuthAccount, PasswordResetToken, RefreshToken, User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.email_service import email_service


class AuthService:
    async def register(self, db: AsyncSession, data: RegisterRequest) -> TokenResponse:
        password_errors = validate_password_strength(data.password)
        if password_errors:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=password_errors)

        existing = await db.scalar(select(User).where(User.email == data.email.lower()))
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

        user = User(
            email=data.email.lower(),
            password_hash=hash_password(data.password),
            full_name=data.full_name.strip(),
            auth_provider=AuthProvider.EMAIL,
            email_verified=False,
        )
        db.add(user)
        await db.flush()

        await self._create_default_organization(db, user)
        await email_service.send_welcome_email(user.email, user.full_name or user.email)

        return await self._issue_tokens(db, user)

    async def login(
        self,
        db: AsyncSession,
        data: LoginRequest,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> TokenResponse:
        user = await db.scalar(select(User).where(User.email == data.email.lower()))
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        if user.locked_until and user.locked_until > datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Account is temporarily locked due to too many failed login attempts",
            )

        if not user.password_hash or not verify_password(data.password, user.password_hash):
            await self._record_failed_login(db, user)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login_at = datetime.now(timezone.utc)
        await db.flush()

        return await self._issue_tokens(db, user, user_agent=user_agent, ip_address=ip_address)

    async def refresh(self, db: AsyncSession, refresh_token: str) -> TokenResponse:
        token_hash = hash_token(refresh_token)
        record = await db.scalar(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
            )
        )
        if not record or record.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

        user = await db.get(User, record.user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        record.revoked_at = datetime.now(timezone.utc)
        return await self._issue_tokens(db, user)

    async def logout(self, db: AsyncSession, refresh_token: str) -> None:
        token_hash = hash_token(refresh_token)
        record = await db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
        if record:
            record.revoked_at = datetime.now(timezone.utc)
            await db.flush()

    async def forgot_password(self, db: AsyncSession, email: str) -> None:
        user = await db.scalar(select(User).where(User.email == email.lower()))
        if not user:
            # Do not reveal whether email exists
            return

        if user.auth_provider != AuthProvider.EMAIL or not user.password_hash:
            return

        raw_token = generate_reset_token()
        reset = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES),
        )
        db.add(reset)
        await db.flush()

        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
        await email_service.send_password_reset_email(user.email, reset_link)

    async def reset_password(self, db: AsyncSession, token: str, new_password: str) -> None:
        password_errors = validate_password_strength(new_password)
        if password_errors:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=password_errors)

        token_hash = hash_token(token)
        record = await db.scalar(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.used_at.is_(None),
            )
        )
        if not record or record.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

        user = await db.get(User, record.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token")

        user.password_hash = hash_password(new_password)
        user.failed_login_attempts = 0
        user.locked_until = None
        record.used_at = datetime.now(timezone.utc)

        # Revoke all refresh tokens on password change
        tokens = await db.scalars(
            select(RefreshToken).where(
                RefreshToken.user_id == user.id,
                RefreshToken.revoked_at.is_(None),
            )
        )
        now = datetime.now(timezone.utc)
        for refresh in tokens:
            refresh.revoked_at = now

        await db.flush()

    async def get_user_by_id(self, db: AsyncSession, user_id: uuid.UUID) -> User:
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    async def oauth_login_or_register(
        self,
        db: AsyncSession,
        provider: AuthProvider,
        provider_account_id: str,
        email: str,
        full_name: str | None,
        avatar_url: str | None,
        access_token: str | None = None,
        refresh_token: str | None = None,
    ) -> TokenResponse:
        oauth_account = await db.scalar(
            select(OAuthAccount).where(
                OAuthAccount.provider == provider,
                OAuthAccount.provider_account_id == provider_account_id,
            )
        )

        if oauth_account:
            user = await db.get(User, oauth_account.user_id)
            if not user:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="OAuth account orphaned")
            user.last_login_at = datetime.now(timezone.utc)
            oauth_account.access_token = access_token
            oauth_account.refresh_token = refresh_token
            await db.flush()
            return await self._issue_tokens(db, user)

        user = await db.scalar(select(User).where(User.email == email.lower()))
        if not user:
            user = User(
                email=email.lower(),
                full_name=full_name,
                avatar_url=avatar_url,
                auth_provider=provider,
                email_verified=True,
                password_hash=None,
            )
            db.add(user)
            await db.flush()
            await self._create_default_organization(db, user)

        oauth = OAuthAccount(
            user_id=user.id,
            provider=provider,
            provider_account_id=provider_account_id,
            access_token=access_token,
            refresh_token=refresh_token,
        )
        db.add(oauth)
        user.last_login_at = datetime.now(timezone.utc)
        await db.flush()
        return await self._issue_tokens(db, user)

    async def _issue_tokens(
        self,
        db: AsyncSession,
        user: User,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> TokenResponse:
        access_token = create_access_token(str(user.id))
        refresh_value = create_refresh_token_value()
        refresh = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(refresh_value),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            user_agent=user_agent,
            ip_address=ip_address,
        )
        db.add(refresh)
        await db.flush()
        await db.refresh(user)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_value,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )

    async def _record_failed_login(self, db: AsyncSession, user: User) -> None:
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCOUNT_LOCKOUT_MINUTES)
        await db.flush()

    async def _create_default_organization(self, db: AsyncSession, user: User) -> None:
        slug_base = re.sub(r"[^a-z0-9]+", "-", (user.full_name or user.email.split("@")[0]).lower()).strip("-")
        slug = f"{slug_base}-{str(user.id)[:8]}"
        org = Organization(name=f"{user.full_name or 'My'} Workspace", slug=slug)
        db.add(org)
        await db.flush()
        db.add(OrganizationMember(organization_id=org.id, user_id=user.id, role=MemberRole.OWNER))


auth_service = AuthService()
