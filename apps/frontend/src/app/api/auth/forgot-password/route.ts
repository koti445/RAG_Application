import { NextRequest, NextResponse } from "next/server";
import { backendApi } from "@/lib/api/backend";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const result = await backendApi.forgotPassword(email);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
