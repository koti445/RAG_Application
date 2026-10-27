import { NextResponse } from "next/server";
import { backendApi } from "@/lib/api/backend";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { getValidAccessToken } from "@/lib/auth/session";

export async function GET() {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const user = await backendApi.getMe(accessToken);
    return NextResponse.json({ user });
  } catch {
    await clearAuthCookies();
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }
}
