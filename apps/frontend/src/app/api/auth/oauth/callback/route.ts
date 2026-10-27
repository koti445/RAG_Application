import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token, expires_in } = await request.json();
    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
    }
    await setAuthCookies(access_token, refresh_token, expires_in || 1800);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to set session" }, { status: 500 });
  }
}
