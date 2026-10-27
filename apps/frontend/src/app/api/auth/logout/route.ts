import { NextResponse } from "next/server";
import { backendApi } from "@/lib/api/backend";
import { clearAuthCookies, getRefreshToken } from "@/lib/auth/cookies";

export async function POST() {
  try {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await backendApi.logout(refreshToken).catch(() => undefined);
    }
    await clearAuthCookies();
    return NextResponse.json({ message: "Logged out" });
  } catch {
    await clearAuthCookies();
    return NextResponse.json({ message: "Logged out" });
  }
}
