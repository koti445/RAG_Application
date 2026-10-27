import { NextRequest, NextResponse } from "next/server";
import { backendApi } from "@/lib/api/backend";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();
    const result = await backendApi.resetPassword(token, newPassword);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reset failed";
    const status = error instanceof Error && "status" in error ? (error as { status: number }).status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
