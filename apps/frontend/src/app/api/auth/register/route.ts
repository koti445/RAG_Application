import { NextRequest, NextResponse } from "next/server";
import { backendApi } from "@/lib/api/backend";
import { setAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();
    const tokens = await backendApi.register(email, password, fullName);
    await setAuthCookies(tokens.access_token, tokens.refresh_token, tokens.expires_in);
    return NextResponse.json({ user: tokens.user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    const status = error instanceof Error && "status" in error ? (error as { status: number }).status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
