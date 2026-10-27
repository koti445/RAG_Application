import { backendApi } from "@/lib/api/backend";
import { isAccessTokenExpired } from "@/lib/auth/jwt";
import { clearAuthCookies, getAccessToken, getRefreshToken, setAuthCookies } from "@/lib/auth/cookies";

/** Return a valid access token, refreshing the session when the cookie token is stale. */
export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = await getAccessToken();
  if (accessToken && !isAccessTokenExpired(accessToken)) {
    return accessToken;
  }

  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const tokens = await backendApi.refresh(refreshToken);
    await setAuthCookies(tokens.access_token, tokens.refresh_token, tokens.expires_in);
    return tokens.access_token;
  } catch {
    await clearAuthCookies();
    return null;
  }
}
