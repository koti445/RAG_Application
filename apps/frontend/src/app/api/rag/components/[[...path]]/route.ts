import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/auth/session";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function proxy(request: NextRequest, path: string[]) {
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const subPath = path.join("/");
  const url = `${API_BASE}/rag/components/${subPath}${request.nextUrl.search}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const init: RequestInit = { method: request.method, headers };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const res = await fetch(url, init);
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}

export async function GET(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxy(req, params.path || []);
}

export async function POST(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxy(req, params.path || []);
}

export async function PATCH(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxy(req, params.path || []);
}

export async function DELETE(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxy(req, params.path || []);
}
