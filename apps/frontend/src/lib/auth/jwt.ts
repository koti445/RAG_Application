/** Decode JWT payload without verification (expiry check only). Edge + Node compatible. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json =
      typeof atob !== "undefined"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Returns true when the access token is expired or within the refresh buffer. */
export function isAccessTokenExpired(token: string, bufferSeconds = 30): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  const expiresAtMs = payload.exp * 1000;
  return expiresAtMs <= Date.now() + bufferSeconds * 1000;
}

/** True when the access cookie is present and not expired. */
export function hasValidAccessToken(accessToken: string | undefined): boolean {
  return Boolean(accessToken && !isAccessTokenExpired(accessToken));
}
