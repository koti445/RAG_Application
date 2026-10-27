# Authentication Setup Guide

## Features

| Feature | Endpoint / Route |
|---------|------------------|
| Email sign up | `POST /api/v1/auth/register` · `/register` |
| Email sign in | `POST /api/v1/auth/login` · `/login` |
| Forgot password | `POST /api/v1/auth/forgot-password` · `/forgot-password` |
| Reset password | `POST /api/v1/auth/reset-password` · `/reset-password?token=...` |
| Refresh session | `POST /api/v1/auth/refresh` |
| Logout | `POST /api/v1/auth/logout` |
| Current user | `GET /api/v1/auth/me` |
| OAuth (Google, GitHub, Microsoft) | `GET /api/v1/auth/oauth/{provider}` |

## Security

- **Password policy**: min 8 chars, uppercase, lowercase, number
- **Account lockout**: 5 failed attempts → 15 min lock
- **JWT access tokens**: 30 min (configurable)
- **Refresh tokens**: stored hashed in DB, rotatable, revocable on logout/password reset
- **httpOnly cookies** on frontend (tokens never exposed to client JS)
- **Anti-enumeration**: forgot-password always returns success message

## Local Development

### 1. Run database migrations

```bash
docker compose up -d postgres
psql -h localhost -U rag_user -d rag_platform -f database/migrations/001_initial_schema.sql
psql -h localhost -U rag_user -d rag_platform -f database/migrations/002_auth_extensions.sql
```

### 2. Start backend

```bash
cd apps/backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Start frontend

```bash
cd apps/frontend
npm install
npm run dev
```

### 4. Password reset (dev)

Leave `SMTP_HOST` empty in `.env`. Reset links are printed in the backend console.

## OAuth Configuration

### Google

1. Create project at [Google Cloud Console](https://console.cloud.google.com/)
2. OAuth consent screen → Credentials → OAuth 2.0 Client ID
3. Authorized redirect URI: `http://localhost:8000/api/v1/auth/oauth/google/callback`
4. Set in `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

### GitHub

1. Settings → Developer settings → OAuth Apps
2. Authorization callback URL: `http://localhost:8000/api/v1/auth/oauth/github/callback`
3. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

### Microsoft / Azure AD

1. Azure Portal → App registrations → New registration
2. Redirect URI: `http://localhost:8000/api/v1/auth/oauth/microsoft/callback`
3. Set `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`

OAuth buttons appear on login/register only when credentials are configured.

## WebSocket Authentication (JWT)

Authenticated real-time connections use the same JWT access tokens as REST.

### Endpoint

```
ws://localhost:8000/api/v1/ws/session
```

### Auth methods

| Method | Example |
|--------|---------|
| Query param | `?token=<JWT_ACCESS_TOKEN>` |
| Header | `Authorization: Bearer <JWT_ACCESS_TOKEN>` |
| First message | `{"type": "authenticate", "token": "<JWT>"}` (within 10s) |

### Message protocol

| Client sends | Server responds |
|--------------|-----------------|
| `{"type": "ping"}` | `{"type": "pong", "timestamp": "..."}` |
| `{"type": "presence"}` | `{"type": "presence", "user_id": "...", "active_connections": N}` |

On connect, server sends:
```json
{"type": "connected", "user_id": "...", "email": "...", "timestamp": "..."}
```

### Frontend usage

```tsx
import { useAuthenticatedWebSocket } from "@/hooks/useAuthenticatedWebSocket";

const { status, send, lastMessage } = useAuthenticatedWebSocket({
  onMessage: (msg) => console.log(msg),
});

send({ type: "ping" });
```

The hook fetches the JWT from `/api/auth/ws-token` (reads httpOnly cookie via BFF), then connects with `?token=`.

### Close codes

| Code | Meaning |
|------|---------|
| 4001 | Unauthorized (missing/invalid/expired JWT) |
| 4003 | Forbidden (deactivated account) |

## Production Checklist

- [ ] Set strong `SECRET_KEY` and `NEXTAUTH_SECRET`
- [ ] Configure SMTP for password reset emails
- [ ] Set `ENV=production` (enables secure cookies)
- [ ] Update `FRONTEND_URL`, `API_BASE_URL`, `CORS_ORIGINS`
- [ ] Register production OAuth redirect URIs with each provider
- [ ] Enable HTTPS
