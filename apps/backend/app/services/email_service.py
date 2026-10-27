"""Email delivery for password reset and notifications."""

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    async def send_password_reset_email(self, to_email: str, reset_link: str) -> None:
        subject = f"{settings.APP_NAME} — Reset your password"
        body = f"""Hello,

You requested a password reset for your {settings.APP_NAME} account.

Click the link below to reset your password (valid for {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes):

{reset_link}

If you did not request this, you can safely ignore this email.

— {settings.APP_NAME} Team
"""
        await self._send(to_email, subject, body)

    async def send_welcome_email(self, to_email: str, full_name: str) -> None:
        subject = f"Welcome to {settings.APP_NAME}"
        body = f"""Hello {full_name},

Your account has been created successfully. You can now sign in and start building RAG pipelines.

— {settings.APP_NAME} Team
"""
        await self._send(to_email, subject, body)

    async def _send(self, to_email: str, subject: str, body: str) -> None:
        if not settings.SMTP_HOST:
            logger.info(
                "[DEV EMAIL] To: %s | Subject: %s\n%s",
                to_email,
                subject,
                body,
            )
            return

        message = EmailMessage()
        message["From"] = settings.SMTP_FROM_EMAIL
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(body)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)


email_service = EmailService()
