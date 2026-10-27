import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/auth/session";

/**
 * Returns a valid JWT access token for WebSocket authentication.
 * Refreshes proactively when the cookie token is expired or near expiry.
 */
export async function GET() {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ access_token: accessToken });
}
