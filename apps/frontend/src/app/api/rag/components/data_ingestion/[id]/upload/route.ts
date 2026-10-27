import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/auth/session";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const formData = await request.formData();
  const url = `${API_BASE}/rag/components/data_ingestion/${params.id}/upload`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}
